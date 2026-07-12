export interface SystemConfig {
  name: string;
  cycles: string[];
  niveaux: string[];
  diplomas: string[];
  evaluationScale: string;
  evaluationType: string;
  bulletinType: string;
  defaultClasses: string[];
}

export const EDUCATIONAL_SYSTEMS_CONFIG: Record<string, SystemConfig> = {
  'Système Franco-Canadien': {
    name: 'Système Franco-Canadien',
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
    evaluationType: 'Lettres (A-F) / Pourcentage',
    bulletinType: 'Bulletins par Compétences et Crédits',
    defaultClasses: ['1re Année Primaire', '3e Année Primaire', 'Sec 1', 'Sec 3', 'Sec 5', 'CÉGEP Préuniversitaire']
  },
  'Système Français': {
    name: 'Système Français',
    cycles: ['Maternelle', 'École Élémentaire', 'Collège', 'Lycée'],
    niveaux: [
      'Cycle 1 (Apprentissages premiers)',
      'Cycle 2 (Apprentissages fondamentaux)',
      'Cycle 3 (Consolidation)',
      'Cycle 4 (Approfondissements)',
      'Seconde (Détermination)',
      'Première (Spécialisation)',
      'Terminale (Examen)'
    ],
    diplomas: [
      'DNB - Diplôme National du Brevet',
      'Baccalauréat Français',
      'CAP - Certificat d\'Aptitude Professionnelle'
    ],
    evaluationScale: '0-20',
    evaluationType: 'Notes sur 20',
    bulletinType: 'Bulletins Trimestriels / Semestriels',
    defaultClasses: ['6ème', '5ème', '4ème', '3ème', 'Seconde', 'Première', 'Terminale']
  },
  'Système Privé Gabonais': {
    name: 'Système Privé Gabonais',
    cycles: ['Pré-primaire', 'Primaire', 'Collège (1er Cycle)', 'Lycée Général', 'Lycée Technique & Professionnel'],
    niveaux: [
      'Pré-primaire (Petite, Moyenne, Grande Section)',
      'Primaire (SIL, CP, CE1, CE2, CM1, CM2)',
      'Premier Cycle (6e, 5e, 4e, 3e)',
      'Second Cycle Général (2nde, 1ère, Tle)',
      'Second Cycle Technique (2nde T, 1ère T, Tle T)',
      'Formations Professionnelles / Alternance'
    ],
    diplomas: [
      'CEPE - Certificat d\'Études Primaires Élémentaires (Gabon)',
      'BEPC - Brevet d\'Études du Premier Cycle (Gabon)',
      'Baccalauréat Gabonais (Série A, B, C, D, E, F, G)',
      'CAP / BEP Professionnels'
    ],
    evaluationScale: '0-20',
    evaluationType: 'Notes sur 20 avec Coefficients',
    bulletinType: 'Bulletins Trimestriels avec Moyennes de Classe et Rangs',
    defaultClasses: ['SIL', 'CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', 'Seconde', 'Première', 'Terminale']
  },
  'Système Public Gabonais': {
    name: 'Système Public Gabonais',
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
      'Baccalauréat Gabonais Officiel'
    ],
    evaluationScale: '0-20',
    evaluationType: 'Notes sur 20 avec Rangs & Coefficients',
    bulletinType: 'Bulletins Trimestriels (Scolarité Officielle Nationale)',
    defaultClasses: ['SIL', 'CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', 'Seconde', 'Première', 'Terminale']
  }
};

export function getSystemConfig(systemName?: string): SystemConfig {
  if (!systemName || !EDUCATIONAL_SYSTEMS_CONFIG[systemName]) {
    return EDUCATIONAL_SYSTEMS_CONFIG['Système Français']; // Default fallback
  }
  return EDUCATIONAL_SYSTEMS_CONFIG[systemName];
}

export function formatGrade(score20: number, systemName?: string): string {
  const config = getSystemConfig(systemName);
  if (config.name === 'Système Franco-Canadien') {
    const pct = Math.min(100, Math.max(0, (score20 / 20) * 100));
    let letter = 'F';
    if (pct >= 90) letter = 'A+';
    else if (pct >= 85) letter = 'A';
    else if (pct >= 80) letter = 'A-';
    else if (pct >= 75) letter = 'B+';
    else if (pct >= 70) letter = 'B';
    else if (pct >= 65) letter = 'C';
    else if (pct >= 60) letter = 'D';
    
    return `${pct.toFixed(1)}% (${letter})`;
  }
  return `${score20.toFixed(2)} / 20`;
}

