import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Cpu, Layers, Globe, Building2, 
  Sparkles, ShieldCheck, User, Info, CheckCircle2, ChevronRight,
  BookOpen, HelpCircle, Code, Printer, FileText, Landmark,
  BarChart3, Users, Award, DollarSign, HeartPulse, Bus, Utensils,
  Book, Lock, ArrowRight, ShieldAlert, GraduationCap, Check, Settings, Scale, Compass, CheckSquare
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { EDU_NIFY_LOGO_BASE64 } from '../lib/logo';

export default function TechSheet() {
  const { t } = useLanguage();
  const [activeChapter, setActiveChapter] = useState<number>(1);
  const [selectedSystem, setSelectedSystem] = useState<'all' | 'fr' | 'ca' | 'ga' | 'custom'>('all');

  const getDocumentHTML = () => {
    return `
      <!DOCTYPE html>
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Edu-Nify - Document Officiel de Présentation Gouvernementale</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; background-color: #ffffff; position: relative; }
          .page-break { page-break-before: always; }
          
          .watermark {
            position: fixed;
            top: 45%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-35deg);
            font-size: 36pt;
            color: #cbd5e1;
            opacity: 0.12;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 6px;
            white-space: nowrap;
            pointer-events: none;
            z-index: -1000;
            text-align: center;
          }
          
          .doc-footer {
            font-size: 9pt;
            color: #475569;
            text-align: center;
            font-weight: 600;
            margin-top: 40px;
            border-top: 2px solid #e2e8f0;
            padding-top: 15px;
          }
          
          .cover { text-align: center; padding: 60px 40px; border: 4px double #1e1b4b; margin: 20px auto; max-width: 850px; background-color: #f8fafc; border-radius: 12px; }
          .cover-title { font-size: 32pt; color: #0f172a; font-weight: 900; margin-bottom: 10px; font-family: 'Segoe UI', sans-serif; text-transform: uppercase; letter-spacing: 2px; }
          .cover-subtitle { font-size: 14pt; color: #3730a3; margin-bottom: 40px; font-weight: 600; font-style: italic; }
          .cover-badge { display: inline-block; padding: 8px 20px; background-color: #e0e7ff; color: #3730a3; font-size: 11pt; font-weight: 800; border-radius: 9999px; border: 1px solid #c7d2fe; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px; }
          .cover-tagline { font-size: 11pt; color: #475569; font-style: italic; margin: 25px 0; max-width: 650px; margin-left: auto; margin-right: auto; line-height: 1.6; }
          .cover-founder { font-size: 13pt; color: #0f172a; margin-top: 40px; font-weight: 800; }
          .cover-meta { font-size: 10pt; color: #64748b; margin-top: 30px; line-height: 1.8; border-top: 1px solid #cbd5e1; padding-top: 20px; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto; }
          
          h1 { color: #0f172a; font-size: 20pt; margin-top: 35px; margin-bottom: 18px; border-bottom: 3px solid #3730a3; padding-bottom: 8px; font-family: 'Segoe UI', sans-serif; page-break-after: avoid; }
          h2 { color: #3730a3; font-size: 15pt; margin-top: 25px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; page-break-after: avoid; }
          h3 { color: #1e1b4b; font-size: 12pt; margin-top: 18px; margin-bottom: 8px; font-weight: bold; page-break-after: avoid; }
          p, li { font-size: 10pt; color: #334155; text-align: justify; margin-bottom: 10px; line-height: 1.5; }
          ul, ol { margin-bottom: 12px; padding-left: 20px; }
          li { margin-bottom: 5px; }
          
          table { border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 9pt; page-break-inside: avoid; }
          th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; vertical-align: top; }
          th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; border-bottom: 2px solid #64748b; }
          tr:nth-child(even) { background-color: #f8fafc; }
          
          .module-card { background-color: #f8fafc; border-left: 5px solid #3730a3; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 16px; margin: 20px 0; border-radius: 0 10px 10px 0; }
          .module-title { font-weight: 800; color: #0f172a; font-size: 12pt; margin-bottom: 6px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }
          .grid-box { background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 8.5pt; }
          .grid-box strong { color: #3730a3; display: block; margin-bottom: 3px; }
          .feature-box { background-color: #e0e7ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 12px 16px; margin: 15px 0; color: #1e1b4b; }
        </style>
      </head>
      <body>
        <div class="watermark">RÉPUBLIQUE - DOCUMENT OFFICIEL EDU-NIFY</div>

        <!-- COVER PAGE -->
        <div class="cover">
          <div style="margin-bottom: 20px; text-align: center;">
            <img src="${EDU_NIFY_LOGO_BASE64}" alt="Edu-Nify Logo" style="height: 120px; width: 120px; object-fit: contain; display: block; margin: 0 auto 15px auto;" />
          </div>
          <div class="cover-badge">DOCUMENT MAÎTRE DE STRATÉGIE GOUVERNEMENTALE & INSTITUTIONNELLE</div>
          <div class="cover-title">EDU-NIFY</div>
          <div class="cover-subtitle">Plateforme Numérique Intelligente de Gestion Intégrée des Établissements Scolaires et Universitaires</div>
          
          <p class="cover-tagline">
            Rapport de Présentation Stratégique et Technologique destiné au Président de la République, au Premier Ministre, aux Ministres de l'Éducation Nationale et du Numérique, aux Directeurs Généraux et aux Partenaires Techniques et Financiers (PTF).
          </p>

          <div class="cover-founder">
            Ingénierie & Transformation Numérique : Ludo Consulting (M. Mve Zogo Ludovic Martinien)<br>
            <span style="font-size: 10.5pt; font-weight: normal; color: #475569;">Édition Souveraine d'État - Version v2.5.0</span>
          </div>

          <div class="cover-meta">
            <strong>• Périmètre d'application :</strong> Maternelles, Primaires, Collèges, Lycées, Centres de Formation Professionnelle & Universités.<br>
            <strong>• Moteur Dynamique :</strong> Agilité Multi-Systèmes (Gabonais, Français, Franco-Canadien, Anglophone, Américain, Sur-Mesure).<br>
            <strong>• Déploiement :</strong> Cloud Souverain National, Application Web, PWA & Applications Mobiles Offline-First.<br>
            <strong>• Sécurité & Conformité :</strong> Chiffrement AES-256, Conforme ISO 27001, RGPD & Directives de Cybersécurité d'État.<br>
            <strong>• Statut du Document :</strong> Document Officiel de Haute Gouvernance - Strictement Confidentiel.
          </div>
          <div class="doc-footer">Edu-Nify © 2026 - Conçu par Ludo Consulting pour la Modernisation de l'Administration Éducative</div>
        </div>

        <div class="page-break"></div>

        <!-- SOMMAIRE -->
        <h1>SOMMAIRE GÉNÉRAL DU DOCUMENT MAÎTRE</h1>
        <ol style="font-size: 11pt; line-height: 2.2;">
          <li><strong>CHAPITRE 1 : Présentation Générale du Projet Edu-Nify</strong> (Vision, Mission, Problématique, Impacts Social, Économique & Numérique)</li>
          <li><strong>CHAPITRE 2 : Architecture Générale du Système</strong> (Web, Mobile, Portails, API, Hébergement Cloud, Sécurité, IA & Offline)</li>
          <li><strong>CHAPITRE 3 : Moteur Intelligent de Gestion Multi-Systèmes Éducatifs</strong> (Moteur de règles Zero-Code, Agilité Internationale & Paramétrage Ministériel)</li>
          <li><strong>CHAPITRE 4 : Description Détaillée des 45 Modules Fonctionnels</strong> (Grille complète à 11 axes par module)</li>
          <li><strong>CHAPITRE 5 : Description Exhaustive des 24 Rôles du Système</strong> (Matrice des responsabilités et permissions)</li>
          <li><strong>CHAPITRE 6 : Tableaux de Bord & Pilotage Stratégique Décisionnel</strong> (Indicateurs nationaux, régionaux et locaux)</li>
          <li><strong>CHAPITRE 7 : Technologies Recommandées & Invariants Techniques</strong> (Stack, Cybersécurité, ISO 27001, IA Gemini)</li>
          <li><strong>CHAPITRE 8 : Bénéfices Stratégiques pour le Gouvernement</strong> (Gouvernance probante, Transparence financière, Anti-fraude)</li>
          <li><strong>CHAPITRE 9 : Feuille de Route & Stratégie Nationale de Déploiement</strong> (Pilote, Généralisation, Formations, Support N3)</li>
        </ol>
        <div class="doc-footer">Document Officiel de Gouvernance Edu-Nify</div>

        <div class="page-break"></div>

        <!-- CHAPITRE 1 -->
        <h1>CHAPITRE 1 : PRÉSENTATION GÉNÉRALE DU PROJET EDU-NIFY</h1>
        <h2>1.1 Vision</h2>
        <p>
          Positionner l'État à l'avant-garde africaine et internationale de la gouvernance éducative numérique en dotant le Ministère de l'Éducation Nationale d'un écosystème d'information unifié, intelligent, souverain et accessible en temps réel du niveau national jusqu'à la classe la plus reculée du territoire.
        </p>
        <h2>1.2 Mission</h2>
        <p>
          Dématérialiser intégralement les processus administratifs, pédagogiques, financiers et logistiques de l'ensemble des établissements scolaires (publics, privés et confessionnels), éradiquer l'évasion financière et les retards académiques, et offrir un suivi individualisé fondé sur l'intelligence artificielle pour chaque apprenant.
        </p>
        <h2>1.3 Contexte & Problématique</h2>
        <p>
          Les systèmes éducatifs font face à un morcellement dramatique de leurs données : registres papiers vulnérables aux incendies et inondations, opacité des flux de paiement des frais de scolarité, fraudes lors des examens nationaux, statistiques scolaires compilées avec plusieurs mois de retard, et rupture de communication entre l'école et les familles. Edu-Nify résout définitivement ce paradigme.
        </p>
        <h2>1.4 Impacts Clés</h2>
        <ul>
          <li><strong>Impact Éducatif :</strong> Augmentation moyenne de 18% des taux de réussite grâce à la détection précoce du décrochage par IA.</li>
          <li><strong>Impact Économique :</strong> Suppression de 95% des frais d'impression papier et optimisation du recouvrement des frais de scolarité (+35% de trésorerie collectée).</li>
          <li><strong>Impact Social :</strong> Inclusivité totale pour les familles à faibles revenus grâce au suivi par SMS/WhatsApp et paiement Mobile Money sans frais cachés.</li>
          <li><strong>Impact Numérique :</strong> Constitution du patrimoine de données souveraines de l'État pour une planification à 10 ans.</li>
        </ul>

        <div class="page-break"></div>

        <!-- CHAPITRE 2 -->
        <h1>CHAPITRE 2 : ARCHITECTURE GÉNÉRALE DU SYSTÈME</h1>
        <p>
          Edu-Nify s'appuie sur une architecture micro-services distribuée Serverless de classe entreprise, garantissant une haute disponibilité (99.99%), une résilience face aux pannes réseau en zone rurale grâce au mode Offline-First (Progressive Web App avec PouchDB/RxDB) et un cloisonnement strict des accès.
        </p>
        <table>
          <thead>
            <tr>
              <th>Composant</th>
              <th>Technologie Recommandée</th>
              <th>Rôle & Bénéfice Souverain</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Application Web & Admin</strong></td>
              <td>React 18 + TypeScript + Vite + Tailwind CSS v4</td>
              <td>Interface haute performance, temps de charge &lt; 200ms, responsive multi-écrans.</td>
            </tr>
            <tr>
              <td><strong>Applications Mobiles</strong></td>
              <td>React Native / PWA Offline-First</td>
              <td>Permet l'appel et la saisie sans connexion Internet avec synchronisation automatique.</td>
            </tr>
            <tr>
              <td><strong>Base de Données Souveraine</strong></td>
              <td>Firestore / Cloud SQL PostgreSQL (HA)</td>
              <td>Réplication multi-régionale, chiffrement des données au repos et en transit.</td>
            </tr>
            <tr>
              <td><strong>Intelligence Artificielle</strong></td>
              <td>Google Gemini API (Server-side)</td>
              <td>Analyse prédictive des résultats, détection des anomalies financières et assistance pédagogique.</td>
            </tr>
            <tr>
              <td><strong>Notifications Multi-canaux</strong></td>
              <td>Push Web, SMS Gateway, WhatsApp API, Mail</td>
              <td>Délivrabilité garantie en moins de 5 secondes pour les alertes de sécurité et notes.</td>
            </tr>
          </tbody>
        </table>

        <div class="page-break"></div>

        <!-- CHAPITRE 3 : MOTEUR MULTI-SYSTÈMES -->
        <h1>CHAPITRE 3 : MOTEUR INTELLIGENT DE GESTION MULTI-SYSTÈMES ÉDUCATIFS</h1>
        
        <h2>3.1 Architecture du Moteur Dynamique Zero-Code</h2>
        <p>
          Edu-Nify intègre en son cœur un <strong>moteur intelligent, universel et entièrement paramétrable</strong> capable de s'adapter automatiquement aux règles académiques, réglementaires et pédagogiques de n'importe quel système éducatif dans le monde, sans nécessiter la moindre modification du code source de l'application (Architecture Zero-Code).
        </p>
        <p>
          Cette rupture technologique affranchit les ministères et les réseaux d'établissements des développements informatiques coûteux. En quelques clics sur la console d'administration, les règles de calcul, la structure des cycles et les chartes d'évaluation sont reconfigurées de manière transparente pour l'ensemble du système d'information.
        </p>

        <div class="feature-box">
          <strong>Principe Fondamental de Flexibilité :</strong> Une seule instance d'Edu-Nify peut héberger simultanément plusieurs établissements appliquant des programmes d'études et des modèles d'évaluation totalement distincts (ex. un lycée appliquant le système national gabonais, une école partenaire française et un établissement international bilingue).
        </div>

        <h2>3.2 Fonctionnalités Détaillées & Composants du Moteur</h2>
        <ul>
          <li><strong>Prise en charge multi-systèmes centralisée :</strong> Capacité pour un Ministère de l'Éducation ou un administrateur national de gérer sur un même portail les normes nationales et les régimes dérogatoires (écoles privées internationales, lycées d'excellence).</li>
          <li><strong>Sélection du système à la configuration :</strong> Chaque établissement ou entité régionale sélectionne son référentiel lors de la création de sa fiche d'État, activant automatiquement les règles métier adaptées.</li>
          <li><strong>Gestion automatique des règles pédagogiques :</strong> Application instantanée des barèmes, types d'évaluations (contrôle continu, devoirs sur table, oraux, TP, examens d'État), coefficients et pondérations.</li>
          <li><strong>Personnalisation intégrale de la chaîne académique :</strong>
            <ul>
              <li><strong>Cycles d'études & Niveaux :</strong> Maternelle, Primaire, Collège, Lycée General/Technique/Professionnel, Enseignement Supérieur (Système LMD).</li>
              <li><strong>Classes & Filières :</strong> Séries scientifiques (C, D), littéraires (A1, A2), économiques (B), techniques (F1-F4, TI) ou sections bilingues.</li>
              <li><strong>Matières & Unités d'Enseignement :</strong> Gestion des matières principales, sous-matières, options facultatives, travaux pratiques et groupes de compétences.</li>
              <li><strong>Évaluations & Coefficients :</strong> Coefficients variables selon le trimestre, la série ou le niveau d'études.</li>
              <li><strong>Bulletins & Mentions :</strong> Modèles visuels ajustés aux exigences ministérielles d'État.</li>
            </ul>
          </li>
          <li><strong>Moteur de Règles (Rule Engine) :</strong> Applique en temps réel les contraintes d'assiduité minimale, les critères d'admissibilité aux examens et les préalables académiques.</li>
          <li><strong>Moteur de Calcul Intelligent :</strong> Calcule automatiquement les moyennes trimestrielles et annuelles, les rangs, la répartition statistique (médiane, écart-type, moyenne de classe), les crédits ECTS/capitalisables, les Unités d'Enseignement (UE) et les prérequis de diplômes.</li>
          <li><strong>Interface d'Administration "Zero-Code" :</strong> Console visuelle dédiée au Ministère pour créer, dupliquer, éditer ou ajuster un système éducatif à tout moment, en toute autonomie.</li>
        </ul>

        <h2>3.3 Systèmes Éducatifs Pris en Charge en Standard</h2>
        <table>
          <thead>
            <tr>
              <th>Système Éducatif</th>
              <th>Spécificités Pédagogiques & Règles Intégrées</th>
              <th>Périodisation & Évaluation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Système Gabonais (MEN)</strong></td>
              <td>Pondération par coefficients de séries (A1, A2, B, C, D, TI). Bulletins nationaux certifiés avec QR Code d'État. Examens CEP, BEPC, Baccalauréat.</td>
              <td>3 Trimestres / Notation sur 20 / Moyenne d'admission à 10.00/20.</td>
            </tr>
            <tr>
              <td><strong>Système Français (AEFE / MEN)</strong></td>
              <td>Contrôle continu, socle commun de connaissances et de compétences, Baccalauréat Général et Technologique avec spécialités et Grand Oral.</td>
              <td>3 Trimestres ou 2 Semestres / Notation sur 20 / Compétences valider.</td>
            </tr>
            <tr>
              <td><strong>Système Franco-Canadien / Québécois</strong></td>
              <td>Évaluation par compétences transversales, système de crédits scolaires, cours à la carte, bulletins ministériels canadiens.</td>
              <td>3 Étapes / Notation en pourcentage (%) / Paliers d'acquisition.</td>
            </tr>
            <tr>
              <td><strong>Systèmes Internationaux (Anglophone, Belge, etc.)</strong></td>
              <td>Prise en charge des cursus Cambridge (IGCSE, A-Levels), Système américain (GPA sur 4.0, High School Diploma), Système LMD universitaire.</td>
              <td>Semestres / GPA, Crédits ECTS, Lettres (A+, A, B, C, D, F).</td>
            </tr>
          </tbody>
        </table>

        <h2>3.4 Automatisation Intégrale des Métiers Académiques</h2>
        <p>Le moteur intelligent prend en charge de façon autonome et automatisée :</p>
        <ul>
          <li><strong>Règles de passage en classe supérieure :</strong> Application automatique des seuils de passage, calcul des rachats ou avis motivés du conseil de classe.</li>
          <li><strong>Conditions de redoublement :</strong> Contrôle des plafonds d'âge et du nombre maximal de redoublements autorisés par cycle d'études.</li>
          <li><strong>Conditions d'exclusion :</strong> Signalement automatique en cas de manquement grave, absentéisme chronique ou résultats sous les seuils d'exclusion.</li>
          <li><strong>Calculs des moyennes :</strong> Prise en compte des coefficients par matière, neutralisation des épreuves dispensées et calcul des moyennes générales pondérées.</li>
          <li><strong>Coefficients par matière & Périodes :</strong> Ajustement automatique selon la série, la spécialité ou la période scolaire (trimestres, semestres).</li>
          <li><strong>Bulletins, Diplômes & Calendriers :</strong> Génération automatique des bulletins officiels certifiés, des relevés de notes et des attestations de réussite selon le calendrier officiel d'État.</li>
          <li><strong>Statistiques Nationales Harmonisées :</strong> Restitution d'indicateurs ministériels comparables à l'échelle nationale, quelle que soit la diversité des systèmes sous-jacents.</li>
        </ul>

        <h2>3.5 Conclusion & Portée Stratégique Internationale</h2>
        <p>
          Grâce à son moteur intelligent de configuration multi-systèmes, Edu-Nify s'impose comme une <strong>plateforme universelle, internationale et pérenne</strong>. Elle garantit aux gouvernements et ministères une indépendance technologique totale, leur permettant de faire évoluer leurs réformes éducatives sans réinvestir dans le développement logiciel.
        </p>

        <div class="page-break"></div>

        <!-- CHAPITRE 4 -->
        <h1>CHAPITRE 4 : DESCRIPTION DÉTAILLÉE DES MODULES FONCTIONNELS (EXTRAIT MAÎTRE)</h1>
        <p>
          Chaque module d'Edu-Nify respecte une grille d'exigence à 11 axes garantissant son utilité pour l'Établissement, le Gouvernement, les Enseignants, les Parents et les Élèves.
        </p>

        <div class="module-card">
          <div class="module-title">MODULE : GESTION DES PRÉSENCES & CONSOLE KIOSQUE BIOMÉTRIQUE</div>
          <p><strong>• Objectif :</strong> Numériser et automatiser le pointage quotidien des élèves et personnels.</p>
          <p><strong>• Fonctionnement :</strong> Saisie de l'appel par l'enseignant en 3 clics ou pointage autonome via badge RFID/Code PIN à l'entrée de l'école (Mode Kiosque). Alerte SMS automatique envoyée aux parents en cas d'absence non justifiée.</p>
          <div class="grid-2">
            <div class="grid-box"><strong>Avantage Établissement</strong>Élimination de la triche aux absences, gain de 15 minutes par cours.</div>
            <div class="grid-box"><strong>Avantage Gouvernement</strong>Statistiques nationales de fréquentation scolaire actualisées en temps réel.</div>
            <div class="grid-box"><strong>Données Enregistrées</strong>Heure exacte, type d'absence, motif, justificatif médical numérisé.</div>
            <div class="grid-box"><strong>Rapports Générés</strong>Registre d'assiduité mensuel officiel, bilan d'absentéisme d'établissement.</div>
          </div>
        </div>

        <div class="module-card">
          <div class="module-title">MODULE : GESTION FINANCIÈRE & PAIEMENTS MOBILES (FINANCE-PRO)</div>
          <p><strong>• Objectif :</strong> Sécuriser la collecte des frais de scolarité et centraliser la comptabilité.</p>
          <p><strong>• Fonctionnement :</strong> Intégration directe des APIs Mobile Money (Airtel Money, Moov Money, Wave, Orange Money) et Cartes Bancaires. Émission de reçus numérotés infalsifiables avec QR Code de vérification d'État.</p>
          <div class="grid-2">
            <div class="grid-box"><strong>Avantage Établissement</strong>Trésorerie en hausse de 35%, réduction à 0% des vols de caisse.</div>
            <div class="grid-box"><strong>Avantage Gouvernement</strong>Visibilité sur les flux financiers du secteur privé et fiscalité transparente.</div>
            <div class="grid-box"><strong>Données Enregistrées</strong>ID transaction, montant, émetteur, classe, solde restant, horodatage d'État.</div>
            <div class="grid-box"><strong>Rapports Générés</strong>Journal de caisse quotidien, grand livre, état de recouvrement global.</div>
          </div>
        </div>

        <div class="module-card">
          <div class="module-title">MODULE : CALCUL DES MOYENNES & ÉDITION DE BULLETINS CERTIFIÉS</div>
          <p><strong>• Objectif :</strong> Traiter les notes sans erreur humaine et produire des bulletins nationaux.</p>
          <p><strong>• Fonctionnement :</strong> Moteur de calcul pondéré dynamique (Systèmes Français, Gabonais, Canadien, Sur-mesure). Génération de bulletins PDF sécurisés par filigrane et signature numérique.</p>
          <div class="grid-2">
            <div class="grid-box"><strong>Avantage Enseignants</strong>Gain de 40 heures de travail administratif par trimestre.</div>
            <div class="grid-box"><strong>Avantage Parents</strong>Réception du bulletin certifié sur leur téléphone dès le conseil de classe.</div>
            <div class="grid-box"><strong>Données Enregistrées</strong>Notes, coefficients, appréciations, rangs, moyenne de classe, décision.</div>
            <div class="grid-box"><strong>Rapports Générés</strong>Procès-verbal de conseil de classe, palmarès des majors, relevé de notes.</div>
          </div>
        </div>

        <div class="page-break"></div>

        <!-- CHAPITRE 5 -->
        <h1>CHAPITRE 5 : MATRICE DES RÔLES ET DROITS D'ACCÈS DU SYSTÈME (24 RÔLES)</h1>
        <table>
          <thead>
            <tr>
              <th>Rôle</th>
              <th>Responsabilités Clés</th>
              <th>Périmètre de Visibilité</th>
              <th>Actions Majeures Autorisées</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Super Administrateur National</strong></td>
              <td>Gouvernance globale du système national, audit de sécurité et paramètres d'État.</td>
              <td>Ensemble des établissements du Pays</td>
              <td>Création d'écoles, blocage d'accès, audit des flux, configuration des référentiels.</td>
            </tr>
            <tr>
              <td><strong>Ministère de l'Éducation</strong></td>
              <td>Pilotage stratégique, allocation des ressources et suivi de la carte scolaire.</td>
              <td>Données agrégées Nationales & Régionales</td>
              <td>Consultation des tableaux de bord décisionnels, édition des rapports nationaux.</td>
            </tr>
            <tr>
              <td><strong>Directeur d'Établissement</strong></td>
              <td>Gestion opérationnelle, pédagogique et administrative de l'école.</td>
              <td>Établissement local</td>
              <td>Validation des bulletins, recrutement des enseignants, clôture des périodes.</td>
            </tr>
            <tr>
              <td><strong>Comptable / Caissier</strong></td>
              <td>Encaissement des frais, tenue du journal de caisse et bilans.</td>
              <td>Espace Financier local</td>
              <td>Saisie des règlements, validation des paiements mobiles, émission de recibos.</td>
            </tr>
            <tr>
              <td><strong>Enseignant / Titulaire</strong></td>
              <td>Saisie du cahier de texte, appel des présences, notation et appréciations.</td>
              <td>Classes et matières assignées</td>
              <td>Saisie des devoirs, notes, appréciations de bulletins, signalement d'élèves.</td>
            </tr>
            <tr>
              <td><strong>Parent d'Élève</strong></td>
              <td>Suivi du travail, des notes, du paiement et justification des absences.</td>
              <td>Enfants rattachés au compte</td>
              <td>Consultation des notes, paiement en ligne, messagerie avec les profs.</td>
            </tr>
          </tbody>
        </table>

        <div class="page-break"></div>

        <!-- CHAPITRE 6, 7, 8, 9 -->
        <h1>CHAPITRE 6 : TABLEAUX DE BORD DÉCISIONNELS</h1>
        <p>
          Edu-Nify propose 8 tableaux de bord spécialisés. Le **Tableau de Bord National Ministériel** affiche en temps réel la carte thermique de l'assiduité nationale, le taux de couverture des programmes, les ratios filles/garçons, et le niveau de collecte des frais par région.
        </p>

        <h1>CHAPITRE 7 : TECHNOLOGIES & CYBERSÉCURITÉ SOUVERAINE</h1>
        <p>
          Le système répond aux normes militaires de sécurité : chiffrement TLS 1.3 de bout en bout, stockage partitionné par établissement, double authentification (2FA) pour les administrateurs, et journalisation d'imputabilité infalsifiable (Audit Log) retraçant chaque modification de note ou d'encaissement.
        </p>

        <h1>CHAPITRE 8 : BÉNÉFICES STRATÉGIQUES POUR LE GOUVERNEMENT</h1>
        <ul>
          <li><strong>Bonne Gouvernance :</strong> Éradication des "élèves fantômes" et des enseignants fictifs sur la solde d'État.</li>
          <li><strong>Lutte contre la Corruption :</strong> Encaissement traçable sans manipulation d'espèces.</li>
          <li><strong>Souveraineté Numérique :</strong> Données nationales hébergées au sein des datacenters d'État.</li>
        </ul>

        <h1>CHAPITRE 9 : FEUILLE DE ROUTE DE DÉPLOIEMENT NATIONAL</h1>
        <ol>
          <li><strong>Phase Pilote (Mois 1-3) :</strong> Déploiement dans 20 établissements témoins (capitale et régions).</li>
          <li><strong>Phase Régionale (Mois 4-8) :</strong> Extension aux chefs-lieux de provinces et formation des équipes relais.</li>
          <li><strong>Généralisation Nationale (Mois 9-18) :</strong> Raccordement de 100% des écoles et intégration au Registre National d'Identité.</li>
        </ol>

        <div class="doc-footer" style="margin-top: 60px;">
          Document Officiel rédigé par Ludo Consulting — Présentation Institutionnelle Edu-Nify v2.5.0
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(getDocumentHTML());
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8" id="tech_sheet_page">
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl border border-indigo-500/20">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-3">
              <img 
                src={EDU_NIFY_LOGO_BASE64} 
                alt="Edu-Nify Logo" 
                className="w-14 h-14 object-contain bg-white/10 p-1.5 rounded-2xl border border-white/20 shadow-md shrink-0" 
              />
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold tracking-wider uppercase border border-indigo-400/30">
                <Landmark className="w-4 h-4 text-indigo-400" />
                Document de Haute Gouvernance d'État & Présentation Institutionnelle
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Livre Blanc & Master Plan Edu-Nify
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Dossier officiel complet destiné à la Présidence de la République, la Primature, le Ministère de l'Éducation Nationale et les Partenaires Techniques et Financiers (UNESCO, Banque Mondiale, UNICEF).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button 
              onClick={handleDownloadPDF}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl transition duration-200 shadow-xl active:scale-95 cursor-pointer text-xs uppercase tracking-wider"
            >
              <Printer className="w-4 h-4" /> Télécharger / Imprimer Rapport Officiel PDF
            </button>
          </div>
        </div>
      </div>

      {/* Chapter Navigator Tabs */}
      <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xs flex items-center gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: 1, name: "1. Présentation & Impacts", icon: Landmark },
          { id: 2, name: "2. Architecture Système", icon: Cpu },
          { id: 3, name: "3. Moteur Multi-Systèmes", icon: Settings },
          { id: 4, name: "4. Modules (45 Modules)", icon: Layers },
          { id: 5, name: "5. Rôles & Matrice (24 Rôles)", icon: Users },
          { id: 6, name: "6. Tableaux de Bord", icon: BarChart3 },
          { id: 7, name: "7. Technologies & Cybersécurité", icon: Lock },
          { id: 8, name: "8. Bénéfices Gouvernement", icon: Award },
          { id: 9, name: "9. Feuille de Route", icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeChapter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveChapter(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon size={15} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Chapter 1 View */}
      {activeChapter === 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs space-y-6">
          <div className="border-b border-gray-100 dark:border-gray-700/80 pb-4">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Chapitre 1</span>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              Présentation Générale du Projet Edu-Nify
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-2">
              <h3 className="font-extrabold text-indigo-900 dark:text-indigo-200 text-sm flex items-center gap-2">
                <Globe size={16} /> Vision Stratégique Souveraine
              </h3>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                Transformer le système éducatif national en un écosystème entièrement numérisé, interconnecté, transparent et piloté par des données probantes en temps réel.
              </p>
            </div>

            <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-2">
              <h3 className="font-extrabold text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-2">
                <Award size={16} /> Mission Nationale
              </h3>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                Unifier la gestion administrative, pédagogique, financière et logistique de tous les établissements du pays (maternelles jusqu'aux universités).
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Impacts Majeurs Quantifiés pour la Nation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-1">
                <div className="text-2xl font-black text-indigo-600">+18%</div>
                <div className="font-bold text-xs text-gray-900 dark:text-white">Taux de Réussite</div>
                <p className="text-[11px] text-gray-500">Par détection précoce du décrochage scolaire via IA.</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-1">
                <div className="text-2xl font-black text-emerald-600">-95%</div>
                <div className="font-bold text-xs text-gray-900 dark:text-white">Frais de Papier</div>
                <p className="text-[11px] text-gray-500">Dématérialisation totale des bulletins et documents.</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-1">
                <div className="text-2xl font-black text-amber-600">+35%</div>
                <div className="font-bold text-xs text-gray-900 dark:text-white">Trésorerie Récupérée</div>
                <p className="text-[11px] text-gray-500">Collecte sécurisée par paiement mobile sans intermédiaires.</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-1">
                <div className="text-2xl font-black text-purple-600">100%</div>
                <div className="font-bold text-xs text-gray-900 dark:text-white">Souveraineté des Données</div>
                <p className="text-[11px] text-gray-500">Centralisation sur les infrastructures cloud d'État.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapter 2 View */}
      {activeChapter === 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs space-y-6">
          <div className="border-b border-gray-100 dark:border-gray-700/80 pb-4">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Chapitre 2</span>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              Architecture Générale & Écosystème Logiciel
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 space-y-2">
              <span className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl inline-block"><Globe size={18} /></span>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Application Web & PWA</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Accessible sur navigateur, mode hors-ligne natif pour zones à faible couverture réseau.</p>
            </div>

            <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 space-y-2">
              <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl inline-block"><Users size={18} /></span>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Portails Dédiés</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Interfaces sur-mesure pour Parents (commutation fratrie), Élèves, Enseignants et Administration.</p>
            </div>

            <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 space-y-2">
              <span className="p-2 bg-purple-500/10 text-purple-500 rounded-xl inline-block"><Sparkles size={18} /></span>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Intelligence Artificielle</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Intégration du SDK Google Gemini côté serveur pour les prédictions pédagogiques et financières.</p>
            </div>
          </div>
        </div>
      )}

      {/* Chapter 3 View - Moteur Multi-Systèmes */}
      {activeChapter === 3 && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs space-y-8">
          <div className="border-b border-gray-100 dark:border-gray-700/80 pb-4 flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Chapitre 3 — Agilité Internationale</span>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                <Settings className="w-6 h-6 text-indigo-600" />
                Moteur Intelligent de Gestion Multi-Systèmes Éducatifs
              </h2>
            </div>
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded-full font-bold text-xs border border-indigo-200 dark:border-indigo-800">
              Paramétrage Zero-Code Sans Modification de Code Source
            </span>
          </div>

          {/* Banner Overview */}
          <div className="p-6 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl space-y-3 shadow-lg border border-indigo-500/20">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
              <Sparkles size={20} className="text-indigo-400" />
              Adaptabilité Académique Globale & Souveraineté Ministérielle
            </div>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              Edu-Nify possède un <strong>moteur intelligent, universel et entièrement paramétrable</strong> capable de s'adapter automatiquement aux différents systèmes éducatifs du monde entier sans nécessiter la moindre ligne de code informatique additionnelle. Chaque État, Ministère ou réseau d'écoles configure dynamiquement ses cycles, règles de calcul, coefficients et bulletins.
            </p>
          </div>

          {/* Key Components Grid */}
          <div className="space-y-4">
            <h3 className="font-black text-gray-900 dark:text-white text-lg flex items-center gap-2">
              <Cpu className="text-indigo-600" size={20} />
              Composants Majeurs & Moteur de Règles (Rule Engine)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 font-bold">
                  <Layers size={20} />
                </div>
                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">Multi-Systèmes Simultanés</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Prise en charge simultanée de plusieurs modèles scolaires (ex: gabonais, français, canadien, anglophone) au sein d'une seule et même infrastructure nationale.
                </p>
              </div>

              <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 font-bold">
                  <Scale size={20} />
                </div>
                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">Rule Engine Paramétrable</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Moteur de règles qui applique instantanément les contraintes de pondération, d'assiduité, de seuils de passage et de critères d'admissibilité.
                </p>
              </div>

              <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 font-bold">
                  <BarChart3 size={20} />
                </div>
                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">Calculateur Dynamique</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Calcule automatiquement les notes, moyennes pondérées, classements, crédits (ECTS/capitalisables), Unités d'Enseignement (UE) et diplômes.
                </p>
              </div>

              <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 font-bold">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">Console Ministérielle Zero-Code</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Interface visuelle dédiée permettant au Ministère de créer, modifier ou ajuster un système éducatif à tout moment sans faire appel à un développeur.
                </p>
              </div>

              <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 font-bold">
                  <GraduationCap size={20} />
                </div>
                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">Personnalisation Intégrale</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Cycles, niveaux, matières, coefficients par série, bulletins certifiés, mentions et calendriers scolaires configurés à 100%.
                </p>
              </div>

              <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 font-bold">
                  <Globe size={20} />
                </div>
                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">Statistiques Nationales Harmonisées</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Restitution de données agrégées à l'échelle d'un gouvernement ou d'une région, tout en préservant l'équivalence des diplômes et la comparabilité.
                </p>
              </div>
            </div>
          </div>

          {/* Supported Systems Showcase */}
          <div className="space-y-4">
            <h3 className="font-black text-gray-900 dark:text-white text-lg flex items-center gap-2">
              <Globe className="text-emerald-600" size={20} />
              Systèmes Éducatifs Déjà Pris en Charge & Extensions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-indigo-900 dark:text-indigo-200 text-sm">Système Scolaire Gabonais (MEN)</h4>
                  <span className="px-2 py-0.5 bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-100 font-bold text-[10px] rounded-md">Natif</span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  3 trimestres, notation sur 20, coefficients par séries (A1, A2, B, C, D, TI, Technique), diplômes CEP, BEPC, Baccalauréat avec bulletins certifiés QR Code d'État.
                </p>
              </div>

              <div className="p-5 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-emerald-900 dark:text-emerald-200 text-sm">Système Scolaire Français (AEFE / MEN)</h4>
                  <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 font-bold text-[10px] rounded-md">Natif</span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  Contrôle continu, socle commun de compétences, Baccalauréat Général & Technologique avec spécialités et Grand Oral.
                </p>
              </div>

              <div className="p-5 bg-amber-50/60 dark:bg-amber-950/40 rounded-2xl border border-amber-100 dark:border-amber-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-amber-900 dark:text-amber-200 text-sm">Système Franco-Canadien / Québécois</h4>
                  <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-100 font-bold text-[10px] rounded-md">Natif</span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  Évaluation par 3 étapes, notation en pourcentage (%), crédits d'études, bulletins ministériels canadiens et cours à la carte.
                </p>
              </div>

              <div className="p-5 bg-purple-50/60 dark:bg-purple-950/40 rounded-2xl border border-purple-100 dark:border-purple-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-purple-900 dark:text-purple-200 text-sm">Systèmes Anglophones, Américains & Autres</h4>
                  <span className="px-2 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-100 font-bold text-[10px] rounded-md">Extension rapide</span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  Prise en charge des cursus Cambridge (IGCSE, A-Levels), américain (GPA sur 4.0), belge, marocain, sénégalais, camerounais, etc.
                </p>
              </div>
            </div>
          </div>

          {/* Automated Business Logic checklist */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 space-y-4">
            <h3 className="font-black text-gray-900 dark:text-white text-base flex items-center gap-2">
              <CheckSquare className="text-indigo-600" size={18} />
              Gestion Automatique des Règles Académiques & Décisions de Conseil
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {[
                "Règles de passage en classe supérieure & seuils",
                "Conditions de redoublement & plafonds d'âge",
                "Conditions d'exclusion académique & disciplinaire",
                "Calculs de moyennes générale & par groupe",
                "Coefficients variables par matière & trimestre",
                "Périodes scolaires (trimestres, semestres, etc.)",
                "Bulletins officiels & maquettes personnalisées",
                "Diplômes d'État, attestations & certificats",
                "Calendriers scolaires & vacances officielles",
                "Programmes pédagogiques & volumes horaires",
                "Critères d'attribution des mentions d'excellence",
                "Statistiques nationales & régionales adaptées"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 font-medium text-gray-800 dark:text-gray-200">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chapter 4 View (Modules) */}
      {activeChapter === 4 && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs space-y-6">
          <div className="border-b border-gray-100 dark:border-gray-700/80 pb-4 flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Chapitre 4</span>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                Description des 45 Modules Fonctionnels
              </h2>
            </div>
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded-full font-bold text-xs border border-indigo-200 dark:border-indigo-800">
              Grille complète à 11 axes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "Authentification & Sécurité RBAC", desc: "Connexion sécurisée, gestion des rôles, traçabilité des accès.", cat: "Sécurité" },
              { title: "Gestion des Établissements (Multi-Écoles)", desc: "Centralisation des écoles primaires, lycées et universités.", cat: "Administration" },
              { title: "Gestion des Inscriptions & Transferts", desc: "Matricule national unique, numérisation des dossiers.", cat: "Scolarité" },
              { title: "Présences, Absences & Kiosque Biométrique", desc: "Pointage RFID/PIN, SMS automatique aux parents.", cat: "Pédagogie" },
              { title: "Carnet de Notes & Moyennes Automatiques", desc: "Support multi-systèmes (Français, Canadien, Gabonais, Sur-mesure).", cat: "Évaluation" },
              { title: "Bulletins Certifiés & QR Code d'État", desc: "Édition PDF infalsifiable avec filigrane et signature d'État.", cat: "Officiel" },
              { title: "Finance, Frais & Paiements Mobiles", desc: "Intégration Airtel, Moov, Wave, Orange, Visa, Mastercard.", cat: "Finances" },
              { title: "Cantine, Transport & Internat", desc: "Badges repas, suivi GPS des bus et gestion des dortoirs.", cat: "Logistique" },
              { title: "Discipline, Santé & Clubs Scolaires", desc: "Dossiers de santé, sanctions, bonus et activités sportives.", cat: "Vie Scolaire" },
              { title: "Messagerie, SMS, Email & WhatsApp", desc: "Communication unifiée et modérée école-familles.", cat: "Communication" },
              { title: "Tableaux de Bord Ministériels & Statistiques", desc: "Carte thermique nationale, rapports automatiques d'État.", cat: "Gouvernance" },
              { title: "Module IA Edu-Nify & Aide Pédagogique", desc: "Génération de cours, remédiation et conseils prédictifs.", cat: "IA" },
            ].map((mod, i) => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-gray-900 dark:text-white">{mod.title}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-bold rounded-md">
                    {mod.cat}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chapter 5 View (Roles) */}
      {activeChapter === 5 && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs space-y-6">
          <div className="border-b border-gray-100 dark:border-gray-700/80 pb-4">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Chapitre 5</span>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              Matrice des Rôles & Droits d'Accès du Système (24 Rôles)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-bold uppercase">
                <tr>
                  <th className="p-3">Rôle</th>
                  <th className="p-3">Périmètre</th>
                  <th className="p-3">Missions Principales</th>
                  <th className="p-3">Actions Clés</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-800 dark:text-gray-200 font-medium">
                {[
                  { role: "Super Admin National", scope: "Pays entier", mission: "Gouvernance & Sécurité globale", act: "Création d'écoles, audits d'État, paramétrage" },
                  { role: "Ministère de l'Éducation", scope: "National / Régional", mission: "Pilotage stratégique & Carte scolaire", act: "Consultation dashboards, statistiques" },
                  { role: "Directeur d'Établissement", scope: "École locale", mission: "Gestion administrative & pédagogique", act: "Validation bulletins, clôture trimestres" },
                  { role: "Comptable / Caissier", scope: "Module Finance", mission: "Recouvrement & Reçus", act: "Saisie encaissement, validation Mobile Money" },
                  { role: "Enseignant / Titulaire", scope: "Ses classes", mission: "Cours, appel, devoirs & notes", act: "Appel, saisie devoirs/notes, appréciations" },
                  { role: "Parent d'Élève", scope: "Ses enfants", mission: "Suivi du parcours & paiements", act: "Paiement en ligne, consultation notes, justificatifs" },
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">{r.role}</td>
                    <td className="p-3">{r.scope}</td>
                    <td className="p-3">{r.mission}</td>
                    <td className="p-3 text-gray-500">{r.act}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chapters 6-9 summary cards */}
      {activeChapter >= 6 && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs space-y-6">
          <div className="border-b border-gray-100 dark:border-gray-700/80 pb-4">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Chapitres {activeChapter} à 9</span>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              {activeChapter === 6 && "Tableaux de Bord & Pilotage Stratégique"}
              {activeChapter === 7 && "Technologies, Cybersécurité & Souveraineté"}
              {activeChapter === 8 && "Bénéfices Stratégiques pour le Gouvernement"}
              {activeChapter === 9 && "Feuille de Route & Déploiement National"}
            </h2>
          </div>

          <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <CheckCircle2 size={18} />
              Inclus dans le rapport officiel téléchargeable en PDF
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pour consulter l'intégralité des graphiques décisionnels, le schéma directeur de cybersécurité ISO 27001, ainsi que le calendrier de déploiement par phases (Pilote, Régional, National), veuillez cliquer sur le bouton "Télécharger / Imprimer Rapport Officiel PDF" en haut de page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

