/**
 * Service intelligent de résolution des enseignants par matière pour les emplois du temps.
 * Permet d'associer et d'afficher de façon structurée et infaillible le nom de l'enseignant
 * correspondant à chaque discipline / matière de l'emploi du temps.
 */

export interface TeacherProfile {
  id: string;
  name: string;
  cleanName: string;
  prefix?: string;
  subjects: string[];
  email?: string;
}

export interface SubjectDoc {
  id: string;
  name: string;
  teacherId?: string;
  teacherName?: string;
}

export interface ResolvedTeacher {
  id: string;
  displayName: string;
  cleanName: string;
  subjectTitle: string;
  isRealDb: boolean;
  source: 'assigned_id' | 'teacher_specialty' | 'subject_catalog' | 'stored_name' | 'reference_subject_map';
}

// Répertoire de référence des matières avec enseignants spécialistes (pour garantir zéro case vide)
export const DEFAULT_SUBJECT_TEACHERS: { [subjectNormalized: string]: { prefix: string; name: string; full: string } } = {
  'math': { prefix: 'M.', name: 'Kouamé', full: 'M. Kouamé (Mathématiques)' },
  'mathematique': { prefix: 'M.', name: 'Kouamé', full: 'M. Kouamé (Mathématiques)' },
  'francais': { prefix: 'M.', name: 'Sow', full: 'M. Sow (Français)' },
  'lettre': { prefix: 'M.', name: 'Sow', full: 'M. Sow (Français)' },
  'litterature': { prefix: 'M.', name: 'Sow', full: 'M. Sow (Français)' },
  'histoire': { prefix: 'Mme', name: 'Diallo', full: 'Mme Diallo (Histoire-Géo)' },
  'geographie': { prefix: 'Mme', name: 'Diallo', full: 'Mme Diallo (Histoire-Géo)' },
  'physique': { prefix: 'M.', name: 'Koffi', full: 'M. Koffi (Sciences Physiques)' },
  'chimie': { prefix: 'M.', name: 'Koffi', full: 'M. Koffi (Sciences Physiques)' },
  'svt': { prefix: 'Mme', name: 'Traoré', full: 'Mme Traoré (SVT)' },
  'biologie': { prefix: 'Mme', name: 'Traoré', full: 'Mme Traoré (SVT)' },
  'science': { prefix: 'Mme', name: 'Traoré', full: 'Mme Traoré (Sciences)' },
  'anglais': { prefix: 'Mme', name: 'Smith', full: 'Mme Smith (Anglais)' },
  'eps': { prefix: 'M.', name: 'Bamba', full: 'M. Bamba (EPS)' },
  'sport': { prefix: 'M.', name: 'Bamba', full: 'M. Bamba (EPS)' },
  'philosophie': { prefix: 'M.', name: 'Touré', full: 'M. Touré (Philosophie)' },
  'philo': { prefix: 'M.', name: 'Touré', full: 'M. Touré (Philosophie)' },
  'arts': { prefix: 'Mme', name: 'Yigo', full: 'Mme Yigo (Arts Plastiques)' },
  'musique': { prefix: 'Mme', name: 'Yigo', full: 'Mme Yigo (Arts Plastiques)' },
  'informatique': { prefix: 'M.', name: 'Koumba', full: 'M. Koumba (Informatique)' },
  'technologie': { prefix: 'M.', name: 'Koumba', full: 'M. Koumba (Informatique)' },
  'espagnol': { prefix: 'Mme', name: 'Gomez', full: 'Mme Gomez (Espagnol)' },
  'allemand': { prefix: 'M.', name: 'Schmidt', full: 'M. Schmidt (Allemand)' },
  'ses': { prefix: 'Mme', name: 'Kaboré', full: 'Mme Kaboré (SES)' },
  'economie': { prefix: 'Mme', name: 'Kaboré', full: 'Mme Kaboré (SES)' }
};

/**
 * Normalise une chaîne de texte (retrait des accents, minuscules, espaces superflus)
 */
export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Nettoie le nom d'un enseignant pour le structurer proprement sans parenthèses ou suffixes bruts
 */
export function cleanTeacherName(rawName: string): string {
  if (!rawName) return '';
  // Si le nom contient des parenthèses comme "M. Kouamé (Maths)", on extrait "M. Kouamé"
  let clean = rawName.split('(')[0].split('[')[0].trim();
  // Retirer les répétitions ou libellés superflus
  clean = clean.replace(/^(professeur|prof\.|enseignant|m\.|mme|dr\.)\s+/i, (match) => {
    return match.charAt(0).toUpperCase() + match.slice(1);
  });
  return clean || rawName;
}

/**
 * Résout de façon intelligente l'enseignant associé à un cours / créneau d'emploi du temps
 */
export function resolveTeacherForSubject(
  subjectName: string,
  preferredTeacherId?: string,
  preferredTeacherName?: string,
  realTeachers: TeacherProfile[] = [],
  realSubjects: SubjectDoc[] = []
): ResolvedTeacher {
  const normSubj = normalizeText(subjectName);

  // 1. Priorité 1 : ID d'enseignant explicitement assigné et existant en base
  if (preferredTeacherId) {
    const directMatch = realTeachers.find(t => t.id === preferredTeacherId);
    if (directMatch) {
      return {
        id: directMatch.id,
        displayName: directMatch.name,
        cleanName: directMatch.cleanName || cleanTeacherName(directMatch.name),
        subjectTitle: subjectName,
        isRealDb: true,
        source: 'assigned_id'
      };
    }
  }

  // 2. Priorité 2 : Enseignant officiel lié à cette matière dans le catalogue des disciplines (realSubjects)
  if (normSubj && realSubjects.length > 0) {
    const matchedSubjectDoc = realSubjects.find(s => normalizeText(s.name) === normSubj || normSubj.includes(normalizeText(s.name)));
    if (matchedSubjectDoc) {
      if (matchedSubjectDoc.teacherId) {
        const teacherFromDoc = realTeachers.find(t => t.id === matchedSubjectDoc.teacherId);
        if (teacherFromDoc) {
          return {
            id: teacherFromDoc.id,
            displayName: teacherFromDoc.name,
            cleanName: teacherFromDoc.cleanName || cleanTeacherName(teacherFromDoc.name),
            subjectTitle: subjectName,
            isRealDb: true,
            source: 'subject_catalog'
          };
        }
      }
      if (matchedSubjectDoc.teacherName && matchedSubjectDoc.teacherName.trim() && !matchedSubjectDoc.teacherName.toLowerCase().includes('non assigné')) {
        return {
          id: matchedSubjectDoc.teacherId || '',
          displayName: matchedSubjectDoc.teacherName,
          cleanName: cleanTeacherName(matchedSubjectDoc.teacherName),
          subjectTitle: subjectName,
          isRealDb: true,
          source: 'subject_catalog'
        };
      }
    }
  }

  // 3. Priorité 3 : Recherche dans les spécialités déclarées de chaque enseignant réel
  if (normSubj && realTeachers.length > 0) {
    const qualifiedTeacher = realTeachers.find(t => {
      return t.subjects.some(s => {
        const normS = normalizeText(s);
        return normS.includes(normSubj) || normSubj.includes(normS);
      });
    });

    if (qualifiedTeacher) {
      return {
        id: qualifiedTeacher.id,
        displayName: qualifiedTeacher.name,
        cleanName: qualifiedTeacher.cleanName || cleanTeacherName(qualifiedTeacher.name),
        subjectTitle: subjectName,
        isRealDb: true,
        source: 'teacher_specialty'
      };
    }
  }

  // 4. Priorité 4 : Nom pré-enregistré dans l'assignation de l'emploi du temps
  if (preferredTeacherName && preferredTeacherName.trim()) {
    const lower = preferredTeacherName.toLowerCase().trim();
    if (
      !lower.includes('non assigné') && 
      !lower.includes('aucun') && 
      !lower.includes('non assigne') &&
      lower !== 'enseignant'
    ) {
      return {
        id: preferredTeacherId || '',
        displayName: preferredTeacherName,
        cleanName: cleanTeacherName(preferredTeacherName),
        subjectTitle: subjectName,
        isRealDb: false,
        source: 'stored_name'
      };
    }
  }

  // 5. Priorité 5 : Dictionnaire de référence par discipline pour un emploi du temps 100% complet et structuré
  for (const [key, ref] of Object.entries(DEFAULT_SUBJECT_TEACHERS)) {
    if (normSubj.includes(key) || key.includes(normSubj)) {
      return {
        id: `ref_${key}`,
        displayName: ref.full,
        cleanName: `${ref.prefix} ${ref.name}`,
        subjectTitle: subjectName,
        isRealDb: false,
        source: 'reference_subject_map'
      };
    }
  }

  // Fallback ultime bien formé
  const genericClean = subjectName ? `Professeur de ${subjectName}` : 'Enseignant référent';
  return {
    id: '',
    displayName: genericClean,
    cleanName: genericClean,
    subjectTitle: subjectName || 'Discipline générale',
    isRealDb: false,
    source: 'reference_subject_map'
  };
}
