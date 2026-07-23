import { User } from '../contexts/AuthContext';
import { TargetAudience } from '../types/surveyElection';

export type AppRole = 
  | 'super_admin'
  | 'admin'
  | 'directeur'
  | 'enseignant'
  | 'eleve'
  | 'parent'
  | 'comptable'
  | 'bibliothecaire'
  | 'infirmier'
  | 'surveillant'
  | 'secretaire'
  | 'cuisinier'
  | 'personnel_administratif';

export type PermissionKey = 
  | 'view_dashboard'
  | 'view_all_surveys'
  | 'view_my_surveys'
  | 'create_survey'
  | 'create_teacher_survey'
  | 'edit_survey'
  | 'delete_survey'
  | 'restore_survey'
  | 'archive_survey'
  | 'duplicate_survey'
  | 'close_survey'
  | 'republish_survey'
  | 'view_survey_results'
  | 'view_all_elections'
  | 'view_my_elections'
  | 'create_election'
  | 'edit_election'
  | 'delete_election'
  | 'close_election'
  | 'manage_candidates'
  | 'view_election_results'
  | 'export_results'
  | 'view_stats'
  | 'view_archives'
  | 'manage_trash'
  | 'view_settings'
  | 'vote_survey'
  | 'vote_election'
  | 'view_history'
  | 'view_profile';

/**
 * Normalizes user role and preciseRole into a strict AppRole enum string
 */
export function detectUserRole(user: User | null): AppRole {
  if (!user) return 'eleve';

  const roleLower = (user.role || '').toLowerCase().trim();
  const preciseRole = (user.preciseRole || user.position || '').toLowerCase().trim();
  const email = (user.email || '').toLowerCase().trim();

  // 1. Super Admin
  if (
    email === 'martinienmvezogo@gmail.com' ||
    preciseRole.includes('super administrateur') ||
    preciseRole.includes('super_admin') ||
    preciseRole.includes('super admin') ||
    (roleLower === 'admin' && !user.etablissement)
  ) {
    return 'super_admin';
  }

  // 2. Directeur
  if (
    preciseRole.includes('directeur') ||
    preciseRole.includes('directrice') ||
    preciseRole.includes('proviseur') ||
    preciseRole.includes('principal')
  ) {
    return 'directeur';
  }

  // 3. Admin d'établissement
  if (
    roleLower === 'admin' ||
    preciseRole.includes('administrateur')
  ) {
    return 'admin';
  }

  // 4. Enseignant
  if (roleLower === 'enseignant' || preciseRole.includes('enseignant') || preciseRole.includes('professeur')) {
    return 'enseignant';
  }

  // 5. Élève
  if (roleLower === 'élève' || roleLower === 'eleve' || preciseRole.includes('élève') || preciseRole.includes('eleve')) {
    return 'eleve';
  }

  // 6. Parent
  if (roleLower === 'parent' || preciseRole.includes('parent')) {
    return 'parent';
  }

  // 7. Staff Specific Roles
  if (preciseRole.includes('comptable') || preciseRole.includes('gestionnaire')) return 'comptable';
  if (preciseRole.includes('bibliothecaire') || preciseRole.includes('documentaliste')) return 'bibliothecaire';
  if (preciseRole.includes('infirmier') || preciseRole.includes('sante')) return 'infirmier';
  if (preciseRole.includes('surveillant') || preciseRole.includes('cpe')) return 'surveillant';
  if (preciseRole.includes('secretaire')) return 'secretaire';

  if (roleLower === 'personnel administratif') {
    return 'personnel_administratif';
  }

  return 'eleve';
}

/**
 * Role Permission Definitions Matrix
 */
const ROLE_PERMISSIONS: Record<AppRole, PermissionKey[]> = {
  super_admin: [
    'view_dashboard',
    'view_all_surveys',
    'view_my_surveys',
    'create_survey',
    'create_teacher_survey',
    'edit_survey',
    'delete_survey',
    'restore_survey',
    'archive_survey',
    'duplicate_survey',
    'close_survey',
    'republish_survey',
    'view_survey_results',
    'view_all_elections',
    'view_my_elections',
    'create_election',
    'edit_election',
    'delete_election',
    'close_election',
    'manage_candidates',
    'view_election_results',
    'export_results',
    'view_stats',
    'view_archives',
    'manage_trash',
    'view_settings',
    'vote_survey',
    'vote_election',
    'view_history',
    'view_profile'
  ],
  admin: [
    'view_dashboard',
    'view_all_surveys',
    'view_my_surveys',
    'create_survey',
    'create_teacher_survey',
    'edit_survey',
    'delete_survey',
    'restore_survey',
    'archive_survey',
    'duplicate_survey',
    'close_survey',
    'republish_survey',
    'view_survey_results',
    'view_all_elections',
    'view_my_elections',
    'create_election',
    'edit_election',
    'delete_election',
    'close_election',
    'manage_candidates',
    'view_election_results',
    'export_results',
    'view_stats',
    'view_archives',
    'manage_trash',
    'view_settings',
    'vote_survey',
    'vote_election',
    'view_history',
    'view_profile'
  ],
  directeur: [
    'view_dashboard',
    'view_all_surveys',
    'view_my_surveys',
    'create_survey',
    'edit_survey',
    'delete_survey',
    'archive_survey',
    'duplicate_survey',
    'close_survey',
    'republish_survey',
    'view_survey_results',
    'view_all_elections',
    'create_election',
    'edit_election',
    'delete_election',
    'close_election',
    'manage_candidates',
    'view_election_results',
    'export_results',
    'view_stats',
    'view_archives',
    'vote_survey',
    'vote_election',
    'view_history'
  ],
  enseignant: [
    'view_my_surveys',
    'create_teacher_survey',
    'edit_survey',
    'delete_survey',
    'view_survey_results',
    'view_all_elections',
    'view_election_results',
    'vote_survey',
    'vote_election',
    'view_history'
  ],
  eleve: [
    'view_my_surveys',
    'view_all_elections',
    'vote_survey',
    'vote_election',
    'view_history',
    'view_profile'
  ],
  parent: [
    'view_my_surveys',
    'view_all_elections',
    'vote_survey',
    'vote_election',
    'view_history',
    'view_survey_results',
    'view_election_results'
  ],
  comptable: ['view_my_surveys', 'view_all_elections', 'vote_survey', 'vote_election', 'view_history'],
  bibliothecaire: ['view_my_surveys', 'view_all_elections', 'vote_survey', 'vote_election', 'view_history'],
  infirmier: ['view_my_surveys', 'view_all_elections', 'vote_survey', 'vote_election', 'view_history'],
  surveillant: ['view_my_surveys', 'view_all_elections', 'vote_survey', 'vote_election', 'view_history'],
  secretaire: ['view_my_surveys', 'view_all_elections', 'vote_survey', 'vote_election', 'view_history'],
  cuisinier: ['view_my_surveys', 'view_all_elections', 'vote_survey', 'vote_election', 'view_history'],
  personnel_administratif: ['view_my_surveys', 'view_all_elections', 'vote_survey', 'vote_election', 'view_history']
};

/**
 * Check if user has specific permission
 */
export function hasPermission(
  user: User | null, 
  permission: PermissionKey, 
  contextItem?: { authorId?: string; createdBy?: string }
): boolean {
  if (!user) return false;
  const appRole = detectUserRole(user);

  // Super Admin bypasses all checks
  if (appRole === 'super_admin') return true;

  const allowedPermissions = ROLE_PERMISSIONS[appRole] || [];
  const hasBasePermission = allowedPermissions.includes(permission);

  if (!hasBasePermission) return false;

  // Context-based checks (e.g. Enseignant modifying only their own survey)
  if (appRole === 'enseignant' && (permission === 'edit_survey' || permission === 'delete_survey')) {
    if (contextItem) {
      const creator = contextItem.authorId || contextItem.createdBy;
      return creator === user.id;
    }
  }

  return true;
}

/**
 * Check if item (survey or election) is targeted to user
 */
export function isUserInTargetAudience(user: User | null, targetAudience?: TargetAudience): boolean {
  if (!user) return false;
  if (!targetAudience || targetAudience.scope === 'all') return true;

  const appRole = detectUserRole(user);

  // Roles checking
  if (targetAudience.roles && targetAudience.roles.length > 0) {
    if (targetAudience.roles.includes('all')) return true;
    if (targetAudience.roles.includes(user.role)) return true;
    if (targetAudience.roles.includes(appRole)) return true;
  }

  // Classes checking
  if (targetAudience.classes && targetAudience.classes.length > 0) {
    if (user.classe && targetAudience.classes.includes(user.classe)) return true;
    if (user.classes && user.classes.some(c => targetAudience.classes?.includes(c))) return true;
  }

  // Specific User IDs
  if (targetAudience.userIds && targetAudience.userIds.includes(user.id)) {
    return true;
  }

  // Scope specific
  if (targetAudience.scope === 'teachers' && (appRole === 'enseignant' || user.role === 'enseignant')) return true;
  if (targetAudience.scope === 'parents' && (appRole === 'parent' || user.role === 'parent')) return true;
  if (targetAudience.scope === 'staff' && (appRole !== 'eleve' && appRole !== 'parent')) return true;

  return false;
}

/**
 * Returns formatted role display string in French
 */
export function getRoleLabel(role: AppRole): string {
  switch (role) {
    case 'super_admin': return 'Super Administrateur';
    case 'admin': return 'Administrateur';
    case 'directeur': return 'Directeur';
    case 'enseignant': return 'Enseignant';
    case 'eleve': return 'Élève';
    case 'parent': return 'Parent';
    case 'comptable': return 'Comptable';
    case 'bibliothecaire': return 'Bibliothécaire';
    case 'infirmier': return 'Infirmier(ère)';
    case 'surveillant': return 'Surveillant';
    case 'secretaire': return 'Secrétaire';
    case 'cuisinier': return 'Chef Cuisinier';
    case 'personnel_administratif': return 'Personnel Administratif';
    default: return 'Utilisateur';
  }
}
