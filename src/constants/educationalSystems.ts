export interface SystemHonorsTier {
  min: number;
  minScore?: number;
  maxScore?: number;
  label: string;
  badge: string;
  color: string;
  appreciation: string;
  isAdmitted?: boolean;
}

export interface SystemConfig {
  name: string;
  flag: string;
  cycles: string[];
  niveaux: string[];
  diplomas: string[];
  evaluationScale: string;
  defaultMaxScore: number;
  evaluationType: string;
  bulletinType: string;
  defaultClasses: string[];
  periods: string[];
  evaluationTypes: Array<{ id: string; label: string; defaultCoef: number }>;
  passingThreshold: number;
  honorsScale: SystemHonorsTier[];
  antiFraudRules: {
    maxScoreAllowed: number;
    varianceThreshold: number; // point change alert (e.g. 5 on 20 or 25 on 100)
    lockDelayHours: number; // hours after creation when grade automatically locks
    strictCoefficients: boolean;
    requireRanking: boolean;
    requireExamBypassCode: boolean;
  };
}

export const EDUCATIONAL_SYSTEMS_CONFIG: Record<string, SystemConfig> = {
  'Système Français': {
    name: 'Système Français',
    flag: '🇫🇷',
    cycles: ['Maternelle', 'École Élémentaire', 'Collège', 'Lycée'],
    niveaux: [
      'Cycle 1 (Apprentissages premiers)',
      'Cycle 2 (Apprentissages fondamentaux)',
      'Cycle 3 (Consolidation - 6ème)',
      'Cycle 4 (Approfondissements - 5e/4e/3e)',
      'Seconde Générale & Technologique',
      'Première (Spécialités)',
      'Terminale (Baccalauréat)'
    ],
    diplomas: [
      'DNB - Diplôme National du Brevet',
      'Baccalauréat Général / Technologique',
      'CAP / Bac Professionnel'
    ],
    evaluationScale: '0-20',
    defaultMaxScore: 20,
    evaluationType: 'Notes sur 20 & Contrôle Continu',
    bulletinType: 'Bulletins Trimestriels / Semestriels avec Appréciations',
    defaultClasses: ['6ème A', '5ème B', '4ème A', '3ème C', 'Seconde 1', 'Première Spé', 'Terminale Générale'],
    periods: ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'],
    evaluationTypes: [
      { id: 'ds', label: 'Devoir Surveillé (DS)', defaultCoef: 2 },
      { id: 'interro', label: 'Interrogation Écrite (IE)', defaultCoef: 1 },
      { id: 'bac_blanc', label: 'Bac / Brevet Blanc', defaultCoef: 4 },
      { id: 'oral', label: 'Évaluation Orale', defaultCoef: 1 },
      { id: 'tp', label: 'Travaux Pratiques / Projet', defaultCoef: 1.5 },
      { id: 'cc', label: 'Contrôle Continu', defaultCoef: 1 }
    ],
    passingThreshold: 10,
    honorsScale: [
      { min: 16, label: 'Très Bien (Félicitations)', badge: '🌟 Félicitations du Conseil', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', appreciation: 'Excellents résultats, investissement remarquable.' },
      { min: 14, label: 'Bien (Tableau d\'Honneur)', badge: '🎖️ Tableau d\'Honneur', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800', appreciation: 'Très bon trimestre, travail sérieux et régulier.' },
      { min: 12, label: 'Assez Bien (Encouragements)', badge: '👍 Encouragements', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800', appreciation: 'Résultats satisfaisants, poursuivez vos efforts.' },
      { min: 10, label: 'Passable (Admis)', badge: '⚖️ Admis / Conforme', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', appreciation: 'Ensemble convenable mais peut mieux faire.' },
      { min: 8, label: 'Insuffisant (Avertissement Travail)', badge: '⚠️ Avertissement Travail', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800', appreciation: 'Résultats fragiles, intensifier le travail personnel.' },
      { min: 0, label: 'Très Insuffisant (Mise en Garde)', badge: '🛑 Alerte Rouge / Soutien Requis', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800', appreciation: 'Niveau critique, plan d\'aide individualisé obligatoire.' }
    ],
    antiFraudRules: {
      maxScoreAllowed: 20,
      varianceThreshold: 5.0,
      lockDelayHours: 48,
      strictCoefficients: true,
      requireRanking: false,
      requireExamBypassCode: true
    }
  },

  'Système Franco-Canadien': {
    name: 'Système Franco-Canadien',
    flag: '🇨🇦',
    cycles: ['Maternelle / Préscolaire', 'Primaire', 'Secondaire', 'Collégial (CÉGEP)'],
    niveaux: [
      'Préscolaire (4-5 ans)',
      'Primaire Cycle 1 (1re & 2e année)',
      'Primaire Cycle 2 (3e & 4e année)',
      'Primaire Cycle 3 (5e & 6e année)',
      'Secondaire Cycle 1 (Sec 1 & Sec 2)',
      'Secondaire Cycle 2 (Sec 3, Sec 4, Sec 5)',
      'Collégial / CÉGEP (Préuniversitaire & Technique)'
    ],
    diplomas: [
      'DES - Diplôme d\'Études Secondaires (Québec)',
      'DEC - Diplôme d\'Études Collégiales',
      'SSD - Secondary School Diploma (Canada)'
    ],
    evaluationScale: '0-100 ou Lettres',
    defaultMaxScore: 100,
    evaluationType: 'Pourcentage & Lettres (A-F) / Évaluation par Compétences',
    bulletinType: 'Bulletins par Compétences et Crédits Ministériels',
    defaultClasses: ['1re Année Primaire', '3e Année Primaire', 'Sec 1', 'Sec 3', 'Sec 5', 'CÉGEP Préuniversitaire'],
    periods: ['Étape 1 (Automne)', 'Étape 2 (Hiver)', 'Étape 3 (Printemps / Bilan)'],
    evaluationTypes: [
      { id: 'sommative', label: 'Évaluation Sommative (Étape)', defaultCoef: 2 },
      { id: 'formative', label: 'Évaluation Formative & Devoirs', defaultCoef: 1 },
      { id: 'ministere', label: 'Épreuve Ministérielle MEQ', defaultCoef: 4 },
      { id: 'projet', label: 'Projet d\'Intégration / Recherche', defaultCoef: 2 },
      { id: 'oral_ca', label: 'Communication Orale', defaultCoef: 1 }
    ],
    passingThreshold: 60,
    honorsScale: [
      { min: 90, label: 'A+ (Excellence / Distinction)', badge: '🏆 Distinction Académique (A+)', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', appreciation: 'Dépassement remarquable des compétences ministérielles.' },
      { min: 85, label: 'A (Très Bon Rendement)', badge: '⭐ Rendement Supérieur (A)', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800', appreciation: 'Très bonne maîtrise de l\'ensemble des critères.' },
      { min: 80, label: 'A- (Très Satisfaisant)', badge: '✨ Très Satisfaisant (A-)', color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800', appreciation: 'Compétences solides et bien affirmées.' },
      { min: 75, label: 'B+ (Bien / Au-dessus de la moyenne)', badge: '📘 Bien (B+)', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800', appreciation: 'Bonne autonomie et travail consciencieux.' },
      { min: 70, label: 'B (Satisfaisant)', badge: '📗 Satisfaisant (B)', color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800', appreciation: 'Atteinte des objectifs du programme.' },
      { min: 65, label: 'C (Acceptable / Moyen)', badge: '📙 Moyen (C)', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', appreciation: 'Norme minimale acquise, consolider les bases.' },
      { min: 60, label: 'D (Seuil de Réussite 60%)', badge: '⚠️ Réussite Limite (D)', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800', appreciation: 'Seuil de passage tout juste atteint, tutorat recommandé.' },
      { min: 0, label: 'E/F (Échec / En dessous de 60%)', badge: '🛑 Échec / Non-Réussite (F)', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800', appreciation: 'Crédit non accordé, récupération obligatoire.' }
    ],
    antiFraudRules: {
      maxScoreAllowed: 100,
      varianceThreshold: 20.0,
      lockDelayHours: 48,
      strictCoefficients: true,
      requireRanking: false,
      requireExamBypassCode: true
    }
  },

  'Système Privé Gabonais': {
    name: 'Système Privé Gabonais',
    flag: '🇬🇦',
    cycles: ['Pré-primaire', 'Primaire', 'Collège (1er Cycle)', 'Lycée Général', 'Lycée Technique & Professionnel'],
    niveaux: [
      'Pré-primaire (Petite, Moyenne, Grande Section)',
      'Primaire (SIL, CP, CE1, CE2, CM1, CM2)',
      'Premier Cycle (6e, 5e, 4e, 3e)',
      'Second Cycle Général (2nde, 1ère, Tle A1/A2/B/C/D)',
      'Second Cycle Technique (2nde T, 1ère T, Tle T)',
      'Formations Professionnelles / Alternance'
    ],
    diplomas: [
      'CEPE - Certificat d\'Études Primaires Élémentaires (Gabon)',
      'BEPC - Brevet d\'Études du Premier Cycle (Gabon)',
      'Baccalauréat Gabonais (Séries A1, A2, B, C, D, SI, STT)',
      'CAP / BEP Professionnels Gabonais'
    ],
    evaluationScale: '0-20',
    defaultMaxScore: 20,
    evaluationType: 'Notes sur 20 avec Coefficients Officiels & Rangs',
    bulletinType: 'Bulletins Trimestriels avec Moyennes de Classe, Rangs & Tableau d\'Honneur',
    defaultClasses: ['SIL', 'CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', 'Seconde', 'Première', 'Terminale C', 'Terminale D', 'Terminale A1'],
    periods: ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'],
    evaluationTypes: [
      { id: 'ds_gab', label: 'Devoir Surveillé / Composition (DS)', defaultCoef: 2 },
      { id: 'interro_gab', label: 'Interrogation Écrite (IE)', defaultCoef: 1 },
      { id: 'bac_blanc_gab', label: 'Examen Blanc Officiel (Bac/BEPC)', defaultCoef: 4 },
      { id: 'tp_gab', label: 'Travaux Pratiques / Évaluation continue', defaultCoef: 1.5 }
    ],
    passingThreshold: 10,
    honorsScale: [
      { min: 16, label: 'Tableau d\'Honneur avec Félicitations', badge: '🌟 Félicitations de l\'Établissement', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', appreciation: 'Travail exceptionnel, honneur à l\'établissement.' },
      { min: 14, label: 'Tableau d\'Honneur avec Encouragements', badge: '🎖️ Tableau d\'Honneur (TH)', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800', appreciation: 'Très bons résultats, rigueur exemplaire.' },
      { min: 12, label: 'Tableau d\'Honneur Simple', badge: '👍 Tableau d\'Honneur Simple', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800', appreciation: 'Bilan satisfaisant et régulier.' },
      { min: 10, label: 'Moyenne Obtenue (Passable)', badge: '⚖️ Admis / Passage Autorisé', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', appreciation: 'Passable, renforcer la préparation aux examens.' },
      { min: 8.5, label: 'Avertissement Travail', badge: '⚠️ Avertissement Travail', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800', appreciation: 'Résultats insuffisants, redoubler d\'ardeur.' },
      { min: 0, label: 'Blâme / Avertissement Discipline & Travail', badge: '🛑 Blâme / Risque d\'Échec', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800', appreciation: 'Situation très préoccupante, convocation des parents.' }
    ],
    antiFraudRules: {
      maxScoreAllowed: 20,
      varianceThreshold: 4.5,
      lockDelayHours: 48,
      strictCoefficients: true,
      requireRanking: true,
      requireExamBypassCode: true
    }
  },

  'Système Public Gabonais': {
    name: 'Système Public Gabonais',
    flag: '🇬🇦',
    cycles: ['Enseignement Primaire', 'Enseignement Secondaire Général', 'Enseignement Technique & Professionnel'],
    niveaux: [
      'Primaire SIL & CP (Niveau I)',
      'Primaire CE1 & CE2 (Niveau II)',
      'Primaire CM1 & CM2 (Niveau III)',
      'Secondaire 1er Cycle (6ème à 3ème)',
      'Secondaire 2nd Cycle Général (2nde, 1ère, Terminale)',
      'Secondaire Technique & Industriel'
    ],
    diplomas: [
      'CEPE - Certificat d\'Études Primaires Élémentaires',
      'BEPC - Brevet d\'Études du Premier Cycle',
      'Baccalauréat Gabonais Officiel (Direction Générale des Examens)'
    ],
    evaluationScale: '0-20',
    defaultMaxScore: 20,
    evaluationType: 'Notes sur 20 avec Rangs & Coefficients Stricts',
    bulletinType: 'Bulletins Trimestriels (Scolarité Officielle Nationale)',
    defaultClasses: ['SIL', 'CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', 'Seconde', 'Première', 'Terminale A1', 'Terminale B', 'Terminale C', 'Terminale D'],
    periods: ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'],
    evaluationTypes: [
      { id: 'compo_pub', label: 'Composition Trimestrielle', defaultCoef: 3 },
      { id: 'ds_pub', label: 'Devoir Surveillé', defaultCoef: 2 },
      { id: 'interro_pub', label: 'Interrogation Orale/Écrite', defaultCoef: 1 },
      { id: 'bac_blanc_pub', label: 'Examen Blanc National', defaultCoef: 4 }
    ],
    passingThreshold: 10,
    honorsScale: [
      { min: 16, label: 'Très Bien (Félicitations)', badge: '🌟 Félicitations de la Direction', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', appreciation: 'Excellent élève, travail modèle.' },
      { min: 14, label: 'Bien (Tableau d\'Honneur)', badge: '🎖️ Tableau d\'Honneur', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800', appreciation: 'Très bon travail, continuez ainsi.' },
      { min: 12, label: 'Assez Bien (Encouragements)', badge: '👍 Encouragements', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800', appreciation: 'Résultats satisfaisants.' },
      { min: 10, label: 'Passable (Moyenne)', badge: '⚖️ Moyenne / Admis', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', appreciation: 'Résultats justes, accentuer l\'effort.' },
      { min: 8.5, label: 'Avertissement Travail', badge: '⚠️ Avertissement Travail', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800', appreciation: 'Travail insuffisant.' },
      { min: 0, label: 'Blâme pour Travail', badge: '🛑 Blâme', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800', appreciation: 'Très mauvais résultats, risque de redoublement.' }
    ],
    antiFraudRules: {
      maxScoreAllowed: 20,
      varianceThreshold: 4.5,
      lockDelayHours: 48,
      strictCoefficients: true,
      requireRanking: true,
      requireExamBypassCode: true
    }
  },

  'Système Ivoirien / UEMOA': {
    name: 'Système Ivoirien / UEMOA',
    flag: '🇨🇮',
    cycles: ['Préscolaire', 'Primaire', 'Collège', 'Lycée'],
    niveaux: [
      'Primaire (CP1, CP2, CE1, CE2, CM1, CM2)',
      'Collège (6ème, 5ème, 4ème, 3ème)',
      'Lycée (2nde A/C, 1ère A/C/D, Tle A/C/D)'
    ],
    diplomas: [
      'CEPE - Certificat d\'Études Primaires Élémentaires (CI)',
      'BEPC - Brevet d\'Études du Premier Cycle (CI)',
      'Baccalauréat Ivoirien (Séries A1, A2, C, D, E, F, G)'
    ],
    evaluationScale: '0-20',
    defaultMaxScore: 20,
    evaluationType: 'Devoirs de Niveau & Interrogations écrites (MENA)',
    bulletinType: 'Bulletins Trimestriels avec Coefficients et Rangs MENA',
    defaultClasses: ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', '2nde C', '1ère D', 'Terminale D', 'Terminale A'],
    periods: ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'],
    evaluationTypes: [
      { id: 'dn_ci', label: 'Devoir de Niveau / Commun', defaultCoef: 2.5 },
      { id: 'ds_ci', label: 'Devoir Surveillé de Classe', defaultCoef: 2 },
      { id: 'ie_ci', label: 'Interrogation Écrite (IE)', defaultCoef: 1 },
      { id: 'bac_blanc_ci', label: 'Bac Blanc Régional / National', defaultCoef: 4 }
    ],
    passingThreshold: 10,
    honorsScale: [
      { min: 16, label: 'Tableau d\'Honneur avec Félicitations', badge: '🌟 Félicitations MENA', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', appreciation: 'Excellent travail, élève brillant.' },
      { min: 14, label: 'Tableau d\'Honneur avec Encouragements', badge: '🎖️ Tableau d\'Honneur', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800', appreciation: 'Très bons résultats scolaires.' },
      { min: 12, label: 'Tableau d\'Honneur Simple', badge: '👍 TH Simple', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800', appreciation: 'Résultats satisfaisants.' },
      { min: 10, label: 'Passable (Moyenne atteinte)', badge: '⚖️ Admis', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', appreciation: 'Passable, consolider les matières fondamentales.' },
      { min: 8.5, label: 'Avertissement Travail', badge: '⚠️ Avertissement Travail', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800', appreciation: 'Moyenne non atteinte, soutien scolaire préconisé.' },
      { min: 0, label: 'Blâme Travail', badge: '🛑 Blâme', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800', appreciation: 'Situation critique, vigilance accrue.' }
    ],
    antiFraudRules: {
      maxScoreAllowed: 20,
      varianceThreshold: 5.0,
      lockDelayHours: 48,
      strictCoefficients: true,
      requireRanking: true,
      requireExamBypassCode: true
    }
  },

  'Système Camerounais / CEMAC': {
    name: 'Système Camerounais / CEMAC',
    flag: '🇨🇲',
    cycles: ['Maternelle', 'Primaire', 'Premier Cycle Secondaire', 'Second Cycle Secondaire'],
    niveaux: [
      'Primaire (SIL, CP, CE1, CE2, CM1, CM2)',
      'Secondaire 1er Cycle (6e, 5e, 4e, 3e)',
      'Secondaire 2nd Cycle (2nde C/A, 1ère C/D/A, Tle C/D/A)'
    ],
    diplomas: [
      'CEP - Certificat d\'Études Primaires (Cameroun)',
      'BEPC - Brevet d\'Études du Premier Cycle',
      'Probatoire (Classe de Première)',
      'Baccalauréat de l\'Enseignement Secondaire (MINESEC)'
    ],
    evaluationScale: '0-20',
    defaultMaxScore: 20,
    evaluationType: 'Évaluation par Séquences (6 Séquences annuelles)',
    bulletinType: 'Bulletins Séquentiels & Trimestriels avec Rangs MINESEC',
    defaultClasses: ['6ème', '5ème', '4ème', '3ème', '2nde C', '1ère D', 'Terminale C', 'Terminale D', 'Terminale A4'],
    periods: ['Séquence 1', 'Séquence 2', 'Séquence 3', 'Séquence 4', 'Séquence 5', 'Séquence 6'],
    evaluationTypes: [
      { id: 'seq_eval', label: 'Évaluation Séquentielle MINESEC', defaultCoef: 2 },
      { id: 'seq_harm', label: 'Évaluation Harmonisée d\'Établissement', defaultCoef: 3 },
      { id: 'seq_cc', label: 'Contrôle Continu / TP', defaultCoef: 1 },
      { id: 'seq_prob', label: 'Examen Blanc (Probatoire / Bac)', defaultCoef: 4 }
    ],
    passingThreshold: 10,
    honorsScale: [
      { min: 16, label: 'Tableau d\'Honneur avec Félicitations', badge: '🌟 Félicitations MINESEC', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', appreciation: 'Prestation remarquable et exemplaire.' },
      { min: 14, label: 'Tableau d\'Honneur avec Encouragements', badge: '🎖️ Tableau d\'Honneur', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800', appreciation: 'Très bons résultats séquentiels.' },
      { min: 12, label: 'Tableau d\'Honneur Simple', badge: '👍 Tableau d\'Honneur', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800', appreciation: 'Bonne moyenne séquentielle.' },
      { min: 10, label: 'Moyenne Requise (10/20)', badge: '⚖️ Admis / Conforme', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', appreciation: 'Moyenne acquise, maintenir la cadence.' },
      { min: 8.5, label: 'Avertissement pour Travail', badge: '⚠️ Avertissement Travail', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800', appreciation: 'En deçà du seuil MINESEC, redoubler d\'efforts.' },
      { min: 0, label: 'Blâme pour Travail Insuffisant', badge: '🛑 Blâme', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800', appreciation: 'Échec séquentiel grave.' }
    ],
    antiFraudRules: {
      maxScoreAllowed: 20,
      varianceThreshold: 4.5,
      lockDelayHours: 48,
      strictCoefficients: true,
      requireRanking: true,
      requireExamBypassCode: true
    }
  },

  'Système International / Anglo-Saxon (IB / US / UK)': {
    name: 'Système International / Anglo-Saxon (IB / US / UK)',
    flag: '🌐',
    cycles: ['Early Years (EYFS)', 'Primary / PYP', 'Middle Years / MYP', 'Diploma Programme (IB DP / High School)'],
    niveaux: [
      'Kindergarten (KG1, KG2)',
      'Grade 1 to 5 (Primary)',
      'Grade 6 to 8 (Middle School)',
      'Grade 9 to 10 (IGCSE / MYP)',
      'Grade 11 to 12 (IB Diploma / AP / A-Levels)'
    ],
    diplomas: [
      'IB Diploma Programme (International Baccalaureate)',
      'Cambridge IGCSE & A-Levels',
      'US High School Diploma with AP (Advanced Placement)'
    ],
    evaluationScale: '0-100 / GPA 4.0 / Lettres',
    defaultMaxScore: 100,
    evaluationType: 'GPA (0.0-4.0), Letter Grades (A*-F) & IB Bands (1-7)',
    bulletinType: 'Semester Progress Report & Academic Transcript with GPA',
    defaultClasses: ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9 / IGCSE 1', 'Grade 10 / IGCSE 2', 'Grade 11 / IB DP1', 'Grade 12 / IB DP2'],
    periods: ['Semester 1 (Fall)', 'Semester 2 (Spring)'],
    evaluationTypes: [
      { id: 'summative_intl', label: 'Summative Assessment', defaultCoef: 2 },
      { id: 'formative_intl', label: 'Formative Assessment', defaultCoef: 1 },
      { id: 'midterm_intl', label: 'Mid-term / Semester Exam', defaultCoef: 3 },
      { id: 'final_ib', label: 'IB Mock Exam / Final Assessment', defaultCoef: 4 },
      { id: 'ia_project', label: 'Internal Assessment (IA) / Lab Report', defaultCoef: 2 }
    ],
    passingThreshold: 60,
    honorsScale: [
      { min: 93, label: 'A+ (GPA 4.0 - Dean\'s Honor Roll)', badge: '🏆 Dean\'s Honor List (A+ / 4.0)', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', appreciation: 'Exceptional academic mastery and critical thinking.' },
      { min: 87, label: 'A (GPA 3.7 - High Honors)', badge: '⭐ High Honors (A / 3.7)', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800', appreciation: 'Outstanding achievement across all criteria.' },
      { min: 80, label: 'B+ (GPA 3.3 - Honors)', badge: '✨ Honors List (B+ / 3.3)', color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800', appreciation: 'Solid performance and high engagement.' },
      { min: 73, label: 'B (GPA 3.0 - Good Standing)', badge: '📘 Good Standing (B / 3.0)', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800', appreciation: 'Meets curriculum expectations consistently.' },
      { min: 65, label: 'C+ / C (GPA 2.0-2.3 - Passing)', badge: '📙 Satisfactory (C / 2.0)', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', appreciation: 'Passing grade, improvement needed in specific rubrics.' },
      { min: 60, label: 'D (GPA 1.0 - Academic Warning)', badge: '⚠️ Academic Warning (D / 1.0)', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800', appreciation: 'At-risk performance, remedial support required.' },
      { min: 0, label: 'F (GPA 0.0 - Academic Probation)', badge: '🛑 Academic Probation (F / 0.0)', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800', appreciation: 'No credit earned, academic review initiated.' }
    ],
    antiFraudRules: {
      maxScoreAllowed: 100,
      varianceThreshold: 20.0,
      lockDelayHours: 48,
      strictCoefficients: true,
      requireRanking: false,
      requireExamBypassCode: true
    }
  }
};

export function getSystemConfig(systemName?: string): SystemConfig {
  if (!systemName || typeof systemName !== 'string' || !EDUCATIONAL_SYSTEMS_CONFIG[systemName]) {
    // Try fuzzy match
    const lower = (typeof systemName === 'string' ? systemName : '').toLowerCase();
    if (lower.includes('canada') || lower.includes('québec') || lower.includes('quebec') || lower.includes('franco-canadien')) {
      return EDUCATIONAL_SYSTEMS_CONFIG['Système Franco-Canadien'];
    }
    if (lower.includes('privé gabonais') || lower.includes('prive gabonais')) {
      return EDUCATIONAL_SYSTEMS_CONFIG['Système Privé Gabonais'];
    }
    if (lower.includes('public gabonais') || lower.includes('gabon')) {
      return EDUCATIONAL_SYSTEMS_CONFIG['Système Public Gabonais'];
    }
    if (lower.includes('ivoirien') || lower.includes('côte d\'ivoire') || lower.includes('cote d\'ivoire') || lower.includes('mena')) {
      return EDUCATIONAL_SYSTEMS_CONFIG['Système Ivoirien / UEMOA'];
    }
    if (lower.includes('cameroun') || lower.includes('minesec') || lower.includes('cemac')) {
      return EDUCATIONAL_SYSTEMS_CONFIG['Système Camerounais / CEMAC'];
    }
    if (lower.includes('anglo') || lower.includes('international') || lower.includes('ib') || lower.includes('cambridge')) {
      return EDUCATIONAL_SYSTEMS_CONFIG['Système International / Anglo-Saxon (IB / US / UK)'];
    }
    return EDUCATIONAL_SYSTEMS_CONFIG['Système Français']; // Default fallback
  }
  return EDUCATIONAL_SYSTEMS_CONFIG[systemName];
}

export function formatGrade(score: number, systemName?: string, maxScore: number = 20): string {
  const config = getSystemConfig(systemName);
  
  if (config.evaluationScale.includes('100')) {
    // Normalize to 100%
    const pct = maxScore > 0 ? Math.min(100, Math.max(0, (score / maxScore) * 100)) : score;
    let letter = 'F';
    if (pct >= 90) letter = 'A+';
    else if (pct >= 85) letter = 'A';
    else if (pct >= 80) letter = 'A-';
    else if (pct >= 75) letter = 'B+';
    else if (pct >= 70) letter = 'B';
    else if (pct >= 65) letter = 'C+';
    else if (pct >= 60) letter = 'D';
    
    return `${pct.toFixed(1)}% (${letter})`;
  }
  
  // Standard 20 scale
  const normalized20 = maxScore === 20 ? score : (score / (maxScore || 20)) * 20;
  return `${normalized20.toFixed(2)} / 20`;
}

export function getGradeMention(
  score: number,
  maxScoreOrSystemName?: number | string,
  optionalSystemName?: string
): SystemHonorsTier & { isAdmitted: boolean } {
  let resolvedSystemName: string | undefined;
  let maxScore = 20;

  if (typeof maxScoreOrSystemName === 'number') {
    maxScore = maxScoreOrSystemName;
    resolvedSystemName = typeof optionalSystemName === 'string' ? optionalSystemName : undefined;
  } else if (typeof maxScoreOrSystemName === 'string') {
    resolvedSystemName = maxScoreOrSystemName;
  } else if (typeof optionalSystemName === 'string') {
    resolvedSystemName = optionalSystemName;
  }

  const config = getSystemConfig(resolvedSystemName);
  const is100Scale = config.evaluationScale.includes('100');
  
  // Normalize score to system scale
  let effectiveScore = score;
  if (is100Scale) {
    effectiveScore = maxScore > 0 ? (score / maxScore) * 100 : score;
  } else {
    effectiveScore = maxScore === 20 ? score : (maxScore > 0 ? (score / maxScore) * 20 : score);
  }
  
  let matchedTier = config.honorsScale[config.honorsScale.length - 1];
  for (const tier of config.honorsScale) {
    if (effectiveScore >= tier.min) {
      matchedTier = tier;
      break;
    }
  }

  const isAdmitted = effectiveScore >= config.passingThreshold;

  return {
    ...matchedTier,
    minScore: matchedTier.min,
    maxScore: config.defaultMaxScore,
    isAdmitted
  };
}

export function validateGradeAntiFraud(params: {
  score: number;
  maxScore: number;
  systemName?: string;
  previousScores?: number[];
  inputCoefficient?: number;
  expectedCoefficient?: number;
  createdHoursAgo?: number;
  isUnlocked?: boolean;
}): { isSuspicious: boolean; flags: string[]; alertLevel: 'OK' | 'WARNING' | 'CRITICAL' } {
  const config = getSystemConfig(params.systemName);
  const flags: string[] = [];
  let isSuspicious = false;
  let alertLevel: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';

  // 1. Scale overflow test
  if (params.score < 0) {
    flags.push(`Note négative non autorisée (${params.score})`);
    isSuspicious = true;
    alertLevel = 'CRITICAL';
  }
  if (params.score > params.maxScore) {
    flags.push(`Dépassement du barème officiel : ${params.score} / ${params.maxScore}`);
    isSuspicious = true;
    alertLevel = 'CRITICAL';
  }

  // 2. Sudden statistical variance
  if (params.previousScores && params.previousScores.length > 0) {
    const sum = params.previousScores.reduce((a, b) => a + b, 0);
    const avg = sum / params.previousScores.length;
    const diff = Math.abs(params.score - avg);
    if (diff > config.antiFraudRules.varianceThreshold) {
      flags.push(`Écart statistique suspect (+/- ${diff.toFixed(1)} pts par rapport à la moyenne antérieure de ${avg.toFixed(1)})`);
      isSuspicious = true;
      if (alertLevel === 'OK') alertLevel = 'WARNING';
    }
  }

  // 3. Coefficient alteration check
  if (params.inputCoefficient && params.expectedCoefficient && params.inputCoefficient !== params.expectedCoefficient) {
    flags.push(`Altération de coefficient : saisi (${params.inputCoefficient}) vs barème officiel ${config.name} (${params.expectedCoefficient})`);
    isSuspicious = true;
    alertLevel = 'CRITICAL';
  }

  // 4. Lock delay expired without authorization
  if (params.createdHoursAgo !== undefined && params.createdHoursAgo > config.antiFraudRules.lockDelayHours && !params.isUnlocked) {
    flags.push(`Modification hors délai légal (${config.antiFraudRules.lockDelayHours}h) sans déverrouillage formel du Proviseur`);
    isSuspicious = true;
    alertLevel = 'CRITICAL';
  }

  return { isSuspicious, flags, alertLevel };
}
