import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, Download, Cpu, Layers, Globe, Building2, 
  Sparkles, ShieldCheck, User, Info, CheckCircle2, ChevronRight,
  BookOpen, HelpCircle, Code, Printer
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function TechSheet() {
  const { t } = useLanguage();
  const [selectedSystem, setSelectedSystem] = useState<'all' | 'fr' | 'ca' | 'ga' | 'custom'>('all');

  const getDocumentHTML = () => {
    return `
      <!DOCTYPE html>
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Edu-Nify - Dossier de Présentation Fonctionnelle Complète</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2d3748; padding: 40px; background-color: #ffffff; position: relative; }
          .page-break { page-break-before: always; }
          
          /* Filigrane / Watermark */
          .watermark {
            position: fixed;
            top: 45%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-35deg);
            font-size: 38pt;
            color: #cbd5e1;
            opacity: 0.16;
            filter: alpha(opacity=16);
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 5px;
            white-space: nowrap;
            pointer-events: none;
            z-index: -1000;
            font-family: 'Segoe UI', Arial, sans-serif;
            text-align: center;
          }
          
          /* Footer styling */
          .doc-footer {
            font-size: 9.5pt;
            color: #4f46e5;
            text-align: center;
            font-weight: bold;
            margin-top: 50px;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
            font-family: 'Segoe UI', sans-serif;
            letter-spacing: 0.5px;
          }
          
          /* Page de garde */
          .cover { text-align: center; padding: 80px 40px; border: 4px double #4f46e5; margin: 40px auto; max-width: 800px; background-color: #fcfcfd; }
          .cover-title { font-size: 36pt; color: #1e1b4b; font-weight: bold; margin-bottom: 10px; font-family: 'Segoe UI', sans-serif; text-transform: uppercase; letter-spacing: 2px; }
          .cover-subtitle { font-size: 16pt; color: #4338ca; margin-bottom: 50px; font-weight: 500; font-style: italic; }
          .cover-badge { display: inline-block; padding: 6px 16px; background-color: #eef2ff; color: #4f46e5; font-size: 11pt; font-weight: bold; border-radius: 9999px; border: 1px solid #c7d2fe; margin-bottom: 30px; }
          .cover-tagline { font-size: 12pt; color: #4b5563; font-style: italic; margin: 30px 0; max-width: 600px; margin-left: auto; margin-right: auto; line-height: 1.5; }
          .cover-founder { font-size: 14pt; color: #1f2937; margin-top: 60px; font-weight: bold; }
          .cover-meta { font-size: 10pt; color: #6b7280; margin-top: 40px; line-height: 1.8; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          
          h1 { color: #1e1b4b; font-size: 22pt; margin-top: 40px; margin-bottom: 20px; border-bottom: 3px solid #4f46e5; padding-bottom: 8px; font-family: 'Segoe UI', sans-serif; page-break-after: avoid; }
          h2 { color: #4338ca; font-size: 16pt; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; font-family: 'Segoe UI', sans-serif; page-break-after: avoid; }
          h3 { color: #312e81; font-size: 12pt; margin-top: 20px; margin-bottom: 10px; font-weight: bold; page-break-after: avoid; }
          p, li { font-size: 10.5pt; color: #4a5568; text-align: justify; margin-bottom: 12px; }
          ul, ol { margin-bottom: 15px; padding-left: 20px; }
          li { margin-bottom: 6px; }
          
          /* Tableaux */
          table { border-collapse: collapse; width: 100%; margin: 25px 0; font-size: 9.5pt; page-break-inside: avoid; }
          th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; vertical-align: top; }
          th { background-color: #f1f5f9; color: #1e1b4b; font-weight: bold; border-bottom: 2px solid #94a3b8; }
          tr:nth-child(even) { background-color: #f8fafc; }
          
          .accent-box { background-color: #f8fafc; border-left: 5px solid #4f46e5; padding: 18px; margin: 24px 0; border-radius: 0 12px 12px 0; }
          .accent-box-title { font-weight: bold; color: #1e1b4b; margin-bottom: 6px; font-size: 11pt; }
          .badge-role { display: inline-block; padding: 2px 6px; font-size: 8pt; font-weight: bold; border-radius: 4px; background-color: #e0e7ff; color: #4338ca; margin-right: 4px; margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <!-- FILIGRANE EN ARRIÈRE-PLAN -->
        <div class="watermark">M. Mve Zogo Ludovic Martinien</div>

        <!-- PAGE DE GARDE -->
        <div class="cover">
          <!-- Logo Edu-Nify -->
          <div style="margin-bottom: 30px; text-align: center;">
            <img src="${window.location.origin}/logo.png" alt="Edu-Nify Logo" style="height: 100px; width: 100px; object-fit: contain; display: block; margin: 0 auto 12px auto;" />
          </div>
          <div class="cover-badge">DOCUMENT TECHNIQUE ET FONCTIONNEL OFFICIEL</div>
          <div class="cover-subtitle">Plateforme Intelligente de Gestion Scolaire, Pédagogique, Administrative et Collaborative</div>
          <p class="cover-tagline">
            "Une solution logicielle d'excellence unifiant l'administration financière, le suivi académique bilingue en temps réel, et le pilotage prédictif assisté par l'intelligence artificielle Google Gemini."
          </p>
          <div class="cover-founder">
            Fondateur & Concepteur : Ludo Consulting (Ludovic)<br>
            <span style="font-size: 11pt; font-weight: normal; color: #6b7280;">Édition Spéciale Premium - Juillet 2026</span>
          </div>
          <div class="cover-meta">
            <strong>Établissement cible :</strong> Écoles Primaires, Collèges, Lycées et Centres Universitaires<br>
            <strong>Version du Système :</strong> v2.0.0 (Production Stable)<br>
            <strong>Statut de Confidentialité :</strong> Document d'Architecture Interne Réservé aux Administrateurs
          </div>
          <div class="doc-footer">Fondateur créé par Ludo_Consulting</div>
        </div>

        <div class="page-break"></div>

        <!-- SOMMAIRE -->
        <h1>TABLE DES MATIÈRES</h1>
        <ol style="font-size: 11pt; line-height: 2;">
          <li><strong>Introduction Générale et Contexte de l'Éducation Moderne</strong></li>
          <li><strong>La Vision Stratégique de Ludo Consulting (Ludovic)</strong></li>
          <li><strong>Le Moteur Académique Multi-Systèmes Universel</strong></li>
          <li><strong>Architecture Technique & Stack Logicielle</strong></li>
          <li><strong>Profils des Acteurs & Matrice de Droits d'Accès</strong></li>
          <li><strong>Analyse Exhaustive des 25 Modules Fonctionnels</strong></li>
          <li><strong>Parcours Utilisateurs Détaillés (User Journeys)</strong></li>
          <li><strong>Tableau Récapitulatif des Droits et Privilèges</strong></li>
          <li><strong>Recommandations d'Interface UX/UI et Charte Graphique</strong></li>
          <li><strong>Conclusion Générale et Perspectives d'Évolution</strong></li>
        </ol>
        <div class="doc-footer">Fondateur créé par Ludo_Consulting</div>

        <div class="page-break"></div>

        <!-- CONTENU -->
        <h1>1. INTRODUCTION GÉNÉRALE</h1>
        <p>
          Le secteur éducatif mondial traverse une phase de mutation sans précédent. La gestion administrative des établissements, longtemps dépendante de processus manuels ou de solutions fragmentées (logiciels de notes déconnectés des outils de facturation, messageries informelles), souffre aujourd'hui d'une dispersion préjudiciable à la productivité et à la sécurité des données.
        </p>
        <p>
          <strong>Edu-Nify</strong> résout cette problématique en proposant un écosystème unifié, hautement sécurisé, bilingue, et adaptable en temps réel à n'importe quel modèle académique ou administratif. Conçu pour simplifier la vie des familles nombreuses et offrir aux équipes de direction des leviers de décision performants, Edu-Nify s'impose comme la référence de l'école moderne.
        </p>

        <h1>2. LA VISION STRATÉGIQUE DE LUDO CONSULTING</h1>
        <p>
          Conceptualisée et conçue par <strong>Ludo Consulting (Ludovic)</strong>, Edu-Nify est le fruit d'une réflexion approfondie visant à concilier deux aspects essentiels de la gestion scolaire : l'efficacité administrative et l'épanouissement pédagogique. 
        </p>
        <p>
          La vision portée par Ludovic repose sur la suppression des barrières d'utilisation pour les parents d'élèves, l'automatisation intelligente des flux de facturation pour éliminer les retards de trésorerie, et l'intégration de technologies d'intelligence artificielle haut de gamme (Google Gemini) pour accompagner les enseignants et les gestionnaires dans leurs choix quotidiens.
        </p>

        <h1>3. LE MOTEUR ACADÉMIQUE MULTI-SYSTÈMES UNIVERSEL</h1>
        <p>
          Edu-Nify intègre un moteur de reconfiguration dynamique unique au monde, lui permettant de s'ajuster en temps réel au cadre institutionnel de l'établissement :
        </p>
        <ul>
          <li><strong>Système Français :</strong> Structuration de l'année en 3 trimestres, notation de 0 à 20 points, calcul des moyennes pondérées par coefficients de matière, et édition de bulletins scolaires conformes aux normes ministérielles françaises.</li>
          <li><strong>Système Franco-Canadien :</strong> Structuration par sessions ou semestres, évaluation par compétences acquises ou crédits, barèmes de notation par lettres (A+, A, B, C...) convertis en pourcentages, et gestion de parcours modulaires.</li>
          <li><strong>Système Gabonais & d'Afrique Centrale :</strong> Structuration trimestrielle, calcul automatique des rangs des élèves, mentions de passage (Admis, Redoublement, Exclusion), calcul des moyennes de classe, et attribution automatique des récompenses nationales (Tableau d'Honneur, Félicitations).</li>
          <li><strong>Système Sur-Mesure :</strong> Flexibilité totale permettant de définir librement les périodes d'évaluation (ex: bimestres), les barèmes de notes et les coefficients de calcul des moyennes générales.</li>
        </ul>

        <h1>4. ARCHITECTURE TECHNIQUE & STACK</h1>
        <p>
          La plateforme Edu-Nify s'appuie sur les technologies les plus modernes pour garantir des performances optimales et une sécurité des données sans compromis :
        </p>
        <ul>
          <li><strong>Frontend :</strong> React 18 avec TypeScript pour un code robuste, Vite pour une compilation ultra-rapide, Tailwind CSS v4 pour le design adaptatif (dark/light mode), et Motion pour des transitions fluides.</li>
          <li><strong>Données & Cloud :</strong> Firebase Firestore pour la réactivité temps réel, Firebase Authentication pour la gestion renforcée des comptes.</li>
          <li><strong>Intelligence Artificielle :</strong> Google Gemini API hébergée côté serveur pour analyser les indicateurs de réussite et guider l'aide personnalisée.</li>
        </ul>
        <div class="doc-footer">Fondateur créé par Ludo_Consulting</div>

        <div class="page-break"></div>

        <h1>5. EXPLICATION EXHAUSTIVE DES 25 MODULES FONCTIONNELS</h1>

        <!-- LES MODULES -->
        <h2>MODULE 1 — AUTHENTIFICATION ET SÉCURITÉ</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Sécuriser les accès et préserver la confidentialité des données d'enfants.</div>
          <p>Ce module gère la création de comptes, la réinitialisation de mots de passe, et le cloisonnement strict des accès par rôles (RBAC). Il intègre un journal d'audit de sécurité et un enregistrement des connexions suspectes.</p>
          <span class="badge-role">Admin</span> <span class="badge-role">Enseignant</span> <span class="badge-role">Parent</span> <span class="badge-role">Élève</span>
        </div>

        <h2>MODULE 2 — TABLEAU DE BORD DYNAMIQUE</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Offrir une vue de synthèse claire et actionnable pour chaque profil.</div>
          <p>Dès la connexion, le dashboard présente des statistiques de recouvrement pour l'admin, les devoirs et résultats pour l'élève, l'appel du jour pour l'enseignant, et le sélecteur d'enfant pour les parents.</p>
          <span class="badge-role">Tous les rôles</span>
        </div>

        <h2>MODULE 3 — GESTION DES ÉLÈVES (SCO-PASS)</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Centraliser l'identité légale et le dossier scolaire des apprenants.</div>
          <p>Gestion des inscriptions, attribution de matricules uniques, numérisation des pièces jointes d'inscription, fiches médicales, historiques scolaires et répartition dans les classes.</p>
          <span class="badge-role">Admin</span> <span class="badge-role">Personnel administratif</span>
        </div>

        <h2>MODULE 4 — GESTION DES ENSEIGNANTS</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Piloter les ressources humaines pédagogiques de l'établissement.</div>
          <p>Création des fiches professeurs, attribution des matières habilitées, volume horaire d'enseignement contractuel, et affectation aux classes comme professeur principal ou enseignant référent.</p>
          <span class="badge-role">Admin</span> <span class="badge-role">Personnel administratif</span>
        </div>

        <h2>MODULE 5 — PORTAIL PARENTS & SÉLECTEUR FRATRIE</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Permettre un suivi unifié pour les familles nombreuses.</div>
          <p>Comprend un commutateur interactif permettant aux parents de basculer en un clic du profil de l'aîné au cadet, unifiant les notes, emplois du temps et règlements scolaires distincts de chaque enfant.</p>
          <span class="badge-role">Parent</span>
        </div>

        <h2>MODULE 6 — GESTION DU PERSONNEL ADMINISTRATIF</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Gérer les comptes d'accès des personnels de soutien.</div>
          <p>Définition des accès pour les secrétaires, comptables, surveillants généraux et chefs de cantine, permettant à chacun de travailler de concert dans le système.</p>
          <span class="badge-role">Admin</span>
        </div>

        <h2>MODULE 7 — STRUCTURE DES CLASSES & NIVEAUX</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Cartographier l'arborescence des formations de l'école.</div>
          <p>Configuration des cycles (Primaire, Secondaire, etc.), création des classes physiques, définition des effectifs maximum autorisés pour éviter la surcharge et répartition des élèves.</p>
          <span class="badge-role">Admin</span> <span class="badge-role">Personnel administratif</span>
        </div>

        <h2>MODULE 8 — MATIÈRES & COEFFICIENTS</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Configurer le catalogue de cours et la pondération des notes.</div>
          <p>Création des disciplines, classification par unités d'enseignement (Sciences, Lettres, Langues) et attribution des coefficients spécifiques à chaque matière par niveau.</p>
          <span class="badge-role">Admin</span> <span class="badge-role">Personnel administratif</span>
        </div>

        <h2>MODULE 9 — PLANIFICATION DES EMPLOIS DU TEMPS</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Élaborer les plannings de cours sans conflit de salle ou d'enseignant.</div>
          <p>Grille interactive de planification hebdomadaire. Détection automatique des doublons de salles ou d'heures d'enseignants. Notification immédiate des modifications de plannings.</p>
          <span class="badge-role">Admin</span> <span class="badge-role">Personnel administratif</span> <span class="badge-role">Enseignant</span> <span class="badge-role">Élève</span>
        </div>

        <h2>MODULE 10 — SUIVI D'ASSIDUITÉ ET CONSOLE KIOSQUE</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Enregistrer la présence des élèves de manière rapide et infalsifiable.</div>
          <p>Appel numérique en classe par l'enseignant. Mode Kiosque d'enregistrement autonome des retards ou des présences par badge ou code PIN à l'entrée de l'école, avec relances par email automatiques aux parents.</p>
          <span class="badge-role">Enseignant</span> <span class="badge-role">Personnel administratif</span> <span class="badge-role">Parent</span>
        </div>

        <h2>MODULE 11 — CARNET DE NOTES ET ÉVALUATIONS</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Enregistrer et traiter les notes scolaires de manière transparente.</div>
          <p>Saisie simplifiée des notes d'épreuves (interrogations, devoirs surveillés, examens) avec coefficients. Calcul en direct de la moyenne de classe, de la note max et de la note min de l'évaluation.</p>
          <span class="badge-role">Enseignant</span> <span class="badge-role">Élève</span> <span class="badge-role">Parent</span>
        </div>

        <h2>MODULE 12 — PRODUCTION DE BULLETINS & RÉSULTATS</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Éditer et certifier les rapports d'évaluations officiels.</div>
          <p>Agrégation automatique des notes pour le calcul des moyennes générales individuelles. Intégration du système de décision (rang, félicitations, décision de passage) et génération de bulletins PDF signés.</p>
          <span class="badge-role">Admin</span> <span class="badge-role">Enseignant</span> <span class="badge-role">Parent</span> <span class="badge-role">Élève</span>
        </div>

        <h2>MODULE 13 — DEVOIRS & CAHIER DE TEXTE EN LIGNE</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Organiser les travaux scolaires à réaliser à domicile.</div>
          <p>Publication de consignes avec fichiers joints par l'enseignant, dépôt en ligne des travaux des élèves sous forme de fichiers PDF/Word, correction et notation à l'écran par le professeur.</p>
          <span class="badge-role">Enseignant</span> <span class="badge-role">Élève</span> <span class="badge-role">Parent</span>
        </div>

        <h2>MODULE 14 — BIBLIOTHÈQUE NUMÉRIQUE & COURS</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Mettre à disposition les savoirs et gérer les ressources physiques.</div>
          <p>Espace de stockage de supports de cours (documents, vidéos) organisés par matière. Module de gestion de la bibliothèque physique de l'école : enregistrement des prêts de livres, des dates de retour et des pénalités.</p>
          <span class="badge-role">Enseignant</span> <span class="badge-role">Élève</span> <span class="badge-role">Personnel administratif</span>
        </div>

        <h2>MODULE 15 — MESSAGERIE UNIFIÉE</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Fluidifier la communication professionnelle école-familles.</div>
          <p>Service de messagerie interne sécurisé permettant de dialoguer entre parents, enseignants et administration dans un cadre d'échange modéré, éliminant le besoin de partager des numéros de téléphone personnels.</p>
          <span class="badge-role">Tous les rôles</span>
        </div>

        <h2>MODULE 16 — SYSTÈME DE NOTIFICATIONS GLOBAL</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Garantir la réception immédiate des alertes importantes.</div>
          <p>Moteur d'envoi automatique de notifications applicatives (nouvelle note, remarque comportementale, alerte de scolarité non payée, cours déplacé) consultables instantanément.</p>
          <span class="badge-role">Tous les rôles</span>
        </div>

        <h2>MODULE 17 — GESTION DE LA SCOLARITÉ & FINANCES (FINANCE-PRO)</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Suivre et optimiser les encaissements scolaires.</div>
          <p>Définition des tranches de frais de scolarité par classe. Saisie des paiements parentaux, édition de reçus numérotés certifiés, calcul automatique du solde débiteur par enfant, et tableaux de bord de trésorerie.</p>
          <span class="badge-role">Admin</span> <span class="badge-role">Personnel administratif</span> <span class="badge-role">Parent</span>
        </div>

        <h2>MODULE 18 — DOCUMENTS ADMINISTRATIFS AUTOMATIQUES</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Soulager le secrétariat d'école par l'édition instantanée de pièces.</div>
          <p>Génération automatique en 1 clic de certificats de scolarité officiels en PDF, d'attestations de paiement pour les impôts des parents, ou de cartes scolaires pour les élèves prêtes à être imprimées.</p>
          <span class="badge-role">Personnel administratif</span> <span class="badge-role">Parent</span>
        </div>

        <h2>MODULE 19 — VIE COMPORTEMENTALE & DISCIPLINE</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Suivre et encourager la citoyenneté et le civisme à l'école.</div>
          <p>Saisie des avertissements de discipline, des exclusions temporaires ou retenues. Gestion positive des bonus/malus connectée aux systèmes ludiques des Maisons scolaires pour motiver les élèves.</p>
          <span class="badge-role">Enseignant</span> <span class="badge-role">Personnel administratif</span> <span class="badge-role">Parent</span> <span class="badge-role">Élève</span>
        </div>

        <h2>MODULE 20 — AGENDA SCOLAIRE ET ÉVÉNEMENTS</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Fédérer la communauté autour du calendrier institutionnel.</div>
          <p>Planification des vacances scolaires, conseils de classe, périodes d'examens nationaux, sorties pédagogiques et jours de réunions de l'établissement.</p>
          <span class="badge-role">Tous les rôles</span>
        </div>

        <h2>MODULE 21 — RÉUNIONS PARENTS-PROFESSEURS</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Automatiser la prise de rendez-vous pour les rencontres bilatérales.</div>
          <p>Saisie des créneaux de disponibilité par les enseignants, réservation des créneaux par les parents sur l'application en fonction de leurs disponibilités, et envoi de fiches de suivi.</p>
          <span class="badge-role">Enseignant</span> <span class="badge-role">Parent</span>
        </div>

        <h2>MODULE 22 — AUDIT DE TRÉSORERIE & PILOTAGE STRATÉGIQUE (BI)</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Offrir des outils analytiques à l'équipe de direction.</div>
          <p>Graphiques d'évolution du recouvrement, taux d'assiduité global par classe, matières posant des difficultés scolaires généralisées, et indicateurs d'efficacité budgétaire.</p>
          <span class="badge-role">Admin</span>
        </div>

        <h2>MODULE 23 — PARAMÈTRES DE L'ÉTABLISSEMENT</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Adapter l'application aux coordonnées et logos de l'école.</div>
          <p>Configuration de l'identité de l'école (nom officiel, adresse, contacts administratifs), enregistrement du logo officiel pour l'édition de tous les bulletins et reçus légaux, et barèmes d'évaluation.</p>
          <span class="badge-role">Admin</span>
        </div>

        <h2>MODULE 24 — ADMINISTRATION SYSTÈME ET CONTRÔLE DES RÔLES</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Assurer le cloisonnement de la sécurité informatique.</div>
          <p>Création en masse des accès utilisateurs pour la rentrée, activation ou désactivation instantanée de comptes, et ajustement des autorisations par module de l'application.</p>
          <span class="badge-role">Admin</span>
        </div>

        <h2>MODULE 25 — ARCHIVAGE NUMÉRIQUE & HISTORIQUE</h2>
        <div class="accent-box">
          <div class="accent-box-title">Objectif : Conserver la mémoire historique de l'établissement.</div>
          <p>Journal d'audit transparent (Audit Trail) enregistrant chaque modification critique de note ou d'encaissement (qui a modifié quoi, quand, et avec quelle ancienne valeur) et archivage des anciennes promotions d'élèves.</p>
          <span class="badge-role">Admin</span>
        </div>
        <div class="doc-footer">Fondateur créé par Ludo_Consulting</div>

        <div class="page-break"></div>

        <!-- DROITS D'ACCÈS -->
        <h1>6. TABLEAU DE SYNTHÈSE DES DROITS PAR RÔLE</h1>
        <table>
          <thead>
            <tr>
              <th>Fonctionnalité</th>
              <th>Élève</th>
              <th>Enseignant</th>
              <th>Parent</th>
              <th>Personnel Administratif</th>
              <th>Admin Établissement</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Identité & Inscriptions</strong></td>
              <td>Consulter son profil</td>
              <td>Consulter sa liste de classe</td>
              <td>Consulter la fiche enfant</td>
              <td>Saisir, Modifier & Valider</td>
              <td>Gérer entièrement (Droits globaux)</td>
            </tr>
            <tr>
              <td><strong>Cahier de Texte & Devoirs</strong></td>
              <td>Soumettre travaux</td>
              <td>Créer, Corriger & Noter</td>
              <td>Suivre le statut de remise</td>
              <td>Lecture seule</td>
              <td>Gérer entièrement</td>
            </tr>
            <tr>
              <td><strong>Saisie des Notes</strong></td>
              <td>Consulter</td>
              <td>Saisir & Modifier ses matières</td>
              <td>Consulter</td>
              <td>Consulter</td>
              <td>Valider, Éditer & Exporter</td>
            </tr>
            <tr>
              <td><strong>Contrôle d'Assiduité</strong></td>
              <td>Consulter son taux</td>
              <td>Saisir l'appel de cours</td>
              <td>Déposer justificatifs</td>
              <td>Traiter & Valider</td>
              <td>Gérer entièrement</td>
            </tr>
            <tr>
              <td><strong>Facturation & Comptabilité</strong></td>
              <td>Aucun accès</td>
              <td>Aucun accès</td>
              <td>Payer en ligne & Reçus</td>
              <td>Encaisser & Émettre reçus</td>
              <td>Piloter la trésorerie & Tarifs</td>
            </tr>
            <tr>
              <td><strong>Sécurité & Audit</strong></td>
              <td>Aucun accès</td>
              <td>Aucun accès</td>
              <td>Aucun accès</td>
              <td>Aucun accès</td>
              <td>Gérer l'intégralité du système</td>
            </tr>
          </tbody>
        </table>
        <div class="doc-footer">Fondateur créé par Ludo_Consulting</div>

        <div class="page-break"></div>

        <!-- PARCOURS UTILISATEURS -->
        <h1>7. PARCOURS UTILISATEURS DÉTAILLÉS (USER JOURNEYS)</h1>
        
        <h3>A. Le Parcours d'un Élève</h3>
        <p>
          1. L'élève se connecte à Edu-Nify depuis son mobile ou sa tablette.<br>
          2. Il consulte son emploi du temps sur son dashboard pour connaître sa prochaine classe.<br>
          3. Il accède au module Devoirs, télécharge l'exercice de mathématiques à faire et dépose sa copie numérique.<br>
          4. Il consulte ses dernières notes reçues et le menu de la cantine pour la semaine.
        </p>

        <h3>B. Le Parcours d'un Enseignant</h3>
        <p>
          1. L'enseignant se connecte et accède à sa fiche d'emploi du temps de la journée.<br>
          2. En entrant en classe, il lance l'appel d'assiduité en un clic depuis son application.<br>
          3. En fin de cours, il saisit le plan du cours dans le Cahier de Texte numérique pour les élèves absents.<br>
          4. Le soir, il saisit les notes de l'interrogation de l'après-midi et valide la moyenne générale calculée automatiquement par l'application.
        </p>

        <h3>C. Le Parcours d'un Parent d'Élèves (Suivi Multi-Enfants)</h3>
        <p>
          1. Le parent se connecte et voit s'afficher les informations consolidées de sa famille.<br>
          2. Grâce au sélecteur d'enfant, il choisit d'abord le profil de son aîné pour vérifier son carnet de notes du trimestre.<br>
          3. En un clic sur le commutateur, il passe sur le profil de sa cadette, constate une absence non justifiée, et dépose directement un justificatif médical numérisé.<br>
          4. Il accède ensuite à la facture globale de scolarité, effectue le paiement en ligne sécurisé, et télécharge instantanément son reçu officiel de paiement.
        </p>

        <h1>8. BÉNÉFICES DE LA PLATEFORME POUR L'ÉTABLISSEMENT</h1>
        <ul>
          <li><strong>Gain de temps massif :</strong> Réduction de 80% du temps consacré aux tâches administratives de saisie des notes et de pointage d'assiduité.</li>
          <li><strong>Optimisation de la trésorerie :</strong> Diminution drastique des impayés de scolarité grâce aux alertes de relance financières intelligentes gérées par l'IA d'Edu-Nify.</li>
          <li><strong>Sécurité et traçabilité :</strong> Toutes les actions critiques (changements de notes, validations financières) sont auditées, datées et attribuées, protégeant l'école contre toute fraude.</li>
          <li><strong>Cohésion école-familles :</strong> Un pont de communication continu bilingue qui rassure les parents et renforce l'implication des élèves.</li>
        </ul>

        <h1>9. RECOMMANDATIONS UX/UI ET DESIGN PAR LUDO CONSULTING</h1>
        <p>
          Afin de préserver le caractère haut de gamme instauré par le concept original d'Edu-Nify, l'interface utilisateur de la plateforme doit respecter la charte graphique rigoureuse suivante :
        </p>
        <ul>
          <li><strong>Polices :</strong> Space Grotesk pour les displays et en-têtes (style moderne, technologique et affirmé) et Inter pour le corps de texte (clarté et confort de lecture accrus).</li>
          <li><strong>Teintes :</strong> Utilisation d'un Indigo profond (#4f46e5) comme couleur institutionnelle de confiance, contrasté par des accents de vert Émeraude (#059669) pour la gestion financière comptable.</li>
          <li><strong>Thèmes :</strong> Support natif d'un mode clair épuré (fonds off-white reposants) et d'un mode sombre d'excellence (gris ardoise profond) pour limiter la fatigue visuelle des enseignants.</li>
        </ul>

        <h1>10. CONCLUSION</h1>
        <p>
          Edu-Nify s'impose comme une solution incontournable et d'excellence pour les établissements d'enseignement tournés vers l'avenir. En unifiant les dimensions financière, pédagogique, et administrative au sein d'un écosystème intelligent, la plateforme façonne une gestion scolaire mais humaine, transparente et performante.
        </p>
        <p style="text-align: center; font-style: italic; margin-top: 50px; color: #4f46e5; font-weight: bold;">
          Document d'ingénierie fonctionnelle — Conçu pour l'excellence éducative par Ludo Consulting.
        </p>
        <div class="doc-footer" style="margin-top: 50px;">Fondateur créé par Ludo_Consulting</div>
      </body>
      </html>
    `;
  };

  const handleDownloadWord = () => {
    const htmlContent = getDocumentHTML();
    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'EDU_NIFY_GUIDE_COMPLET_OFFICIEL.doc');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(getDocumentHTML());
      printWindow.document.close();
      printWindow.focus();
      // Short delay to let resource loading complete before printing
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const systems = [
    {
      id: 'fr',
      title: 'Système Français (National)',
      icon: '🇫🇷',
      description: 'Adaptation classique par cycles et trimestres avec calculs pondérés.',
      features: [
        'Découpage automatique en 3 trimestres de scolarité.',
        'Saisie des notes sur un barème standard de 20 points.',
        'Calcul automatique des moyennes de classe pondérées par les coefficients de matière.',
        'Bulletins scolaires officiels conformes aux directives de l\'Éducation Nationale.'
      ]
    },
    {
      id: 'ca',
      title: 'Système Franco-Canadien',
      icon: '🇨🇦',
      description: 'Structure flexible par semestres et gestion par crédits / compétences.',
      features: [
        'Organisation curriculaire par sessions ou semestres modulaires.',
        'Évaluation par acquisition de compétences ou crédits académiques.',
        'Support d\'échelles de notation par lettres (A+, A, B, C...) avec conversion en pourcentages.',
        'Parcours individualisés et choix de cours optionnels pour les élèves.'
      ]
    },
    {
      id: 'ga',
      title: 'Système Gabonais & CEMAC',
      icon: '🇬🇦',
      description: 'Adapté aux exigences spécifiques des pays d\'Afrique Centrale.',
      features: [
        'Algorithme de calcul automatique du rang de chaque élève de la classe.',
        'Gestion des mentions réglementaires (Tableau d\'honneur, Félicitations, Avertissements).',
        'Gestion automatisée des décisions de fin d\'année (Passage, Redoublement, Exclusion).',
        'Format de bulletin de notes standardisé national gabonais.'
      ]
    },
    {
      id: 'custom',
      title: 'Système Sur-Mesure / Hybride',
      icon: '🏫',
      description: 'Flexibilité totale pour les écoles privées internationales.',
      features: [
        'Configuration libre des périodes d\'évaluation (ex: bimestres, semestres).',
        'Formules personnalisables pour le calcul des moyennes générales.',
        'Ajustement à la volée des barèmes de notation de 0 à 10, de 0 à 100 ou personnalisé.',
        'Modèles de rapports scolaires éditables et adaptables aux chartes de l\'établissement.'
      ]
    }
  ];

  const techStack = [
    { name: 'React 18 & TS', category: 'Frontend', desc: 'Typage strict et réactivité optimale de l\'interface.' },
    { name: 'Tailwind CSS v4', category: 'Frontend', desc: 'Performance CSS accrue, thème sombre unifié via @variant dark.' },
    { name: 'Motion / Framer', category: 'Animations', desc: 'Transitions fluides de pages et micro-interactions haut de gamme.' },
    { name: 'Firebase Firestore', category: 'Base de données', desc: 'NoSQL temps réel assurant des données toujours synchronisées.' },
    { name: 'Firebase Auth', category: 'Sécurité', desc: 'Gestion sécurisée des comptes et cloisonnement des rôles (RBAC).' },
    { name: 'Google Gemini SDK', category: 'Intelligence Artificielle', desc: 'Algorithmes prédictifs pour les analyses stratégiques et l\'aide aux devoirs.' }
  ];

  return (
    <div className="space-y-8" id="tech_sheet_page">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl border border-indigo-500/20">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 -mb-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold tracking-wider uppercase border border-indigo-400/20">
              <Cpu className="w-3.5 h-3.5" /> Fiche Technique Officielle
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Edu-Nify Support & Document de Conception
            </h1>
            <p className="text-indigo-200 text-sm sm:text-base font-sans font-light leading-relaxed">
              Consultez l'architecture, la configuration multi-systèmes d'Edu-Nify et téléchargez le guide complet et détaillé de la plateforme sous le format professionnel de votre choix (PDF ou Microsoft Word) réservé exclusivement aux administrateurs.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button 
              onClick={handleDownloadWord}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition duration-200 shadow-lg active:scale-95"
            >
              <FileText className="w-5 h-5" /> Télécharger en Word (.doc)
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl transition duration-200 shadow-lg active:scale-95"
            >
              <Printer className="w-5 h-5" /> Enregistrer en PDF
            </button>
          </div>
        </div>
      </div>

      {/* Founder Info & Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-950/20 rounded-bl-full flex items-center justify-center">
            <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Créateur & Fondateur</h2>
          <div className="mt-4 space-y-2">
            <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white">Ludo Consulting</h3>
            <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Concept de Ludovic</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-2">
              Visionnaire d'un écosystème d'excellence unifiant l'administration, l'intelligence artificielle et la simplification de la vie scolaire des familles nombreuses.
            </p>
          </div>
        </div>

        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Qu'est-ce qu'Edu-Nify ?</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Edu-Nify est une suite logicielle tout-en-un révolutionnaire pour la gestion des écoles modernes. Contrairement aux plateformes standards et limitées, Edu-Nify intègre nativement la gestion multi-établissements, l'automatisation financière intelligente, et s'adapte dynamiquement à n'importe quel référentiel ou système académique national.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">100%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Multi-Écoles & Bilingue</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Gemini AI</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Moteur d'Optimisation</div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Multi-Systems Curriculum Adaptation Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
                Moteur d'Adaptation Académique
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Découvrez comment la plateforme s'adapte instantanément à votre système scolaire d'origine ou à votre formule hybride.
            </p>
          </div>
          
          {/* Selector Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSystem('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${selectedSystem === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              Tous
            </button>
            <button
              onClick={() => setSelectedSystem('fr')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${selectedSystem === 'fr' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              🇫🇷 Français
            </button>
            <button
              onClick={() => setSelectedSystem('ca')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${selectedSystem === 'ca' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              🇨🇦 Franco-Canadien
            </button>
            <button
              onClick={() => setSelectedSystem('ga')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${selectedSystem === 'ga' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              🇬🇦 Gabonais / CEMAC
            </button>
            <button
              onClick={() => setSelectedSystem('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${selectedSystem === 'custom' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              🏫 Sur-Mesure
            </button>
          </div>
        </div>

        {/* Display Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {systems
            .filter(sys => selectedSystem === 'all' || sys.id === selectedSystem)
            .map((sys) => (
              <motion.div
                key={sys.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3 hover:border-indigo-500/20 dark:hover:border-indigo-400/20 transition group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sys.icon}</span>
                  <h3 className="font-display font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {sys.title}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  {sys.description}
                </p>
                <ul className="space-y-1.5 pt-2">
                  {sys.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
            Architecture & Stack Technologique
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {techStack.map((tech, idx) => (
            <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded uppercase tracking-wider">
                  {tech.category}
                </span>
                <h4 className="font-display font-bold text-gray-900 dark:text-white mt-1 text-sm">{tech.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{tech.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Support Guide Index */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
              Guide Interactif d'Utilisation
            </h2>
          </div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg">
            Support Utilisateur
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 flex items-start gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-semibold text-sm text-gray-900 dark:text-white">Administration Multi-Établissements</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pilotez et centralisez plusieurs écoles avec des budgets et des effectifs distincts depuis un unique compte d'administration.</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 flex items-start gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-semibold text-sm text-gray-900 dark:text-white">Sélecteur Parental Intelligent</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Permet aux familles de suivre plusieurs enfants inscrits dans différentes classes ou écoles en commutant instantanément leur profil en 1 clic.</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 flex items-start gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-semibold text-sm text-gray-900 dark:text-white">Module IA "Ludo AI Plus"</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Moteur conversationnel avancé pour aider les enseignants à préparer des cours et guider les élèves avec des aides ciblées.</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 flex items-start gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-semibold text-sm text-gray-900 dark:text-white">Registres de Sécurité & Audit</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Suivi rigoureux et infalsifiable de toutes les connexions et actions critiques (modifications de notes, règlements financiers) effectuées dans le système.</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30 text-center">
          <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">
            Pour obtenir des détails sur le fonctionnement des cartes d'accès RFID, l'enrôlement biométrique, les modules de messagerie bilingues ou la gestion budgétaire analytique, veuillez télécharger le guide technique complet ci-dessus.
          </p>
        </div>
      </div>
    </div>
  );
}
