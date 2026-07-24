export interface Parent {
  id: string;
  nom: string;
  prenom: string;
  sexe?: 'M' | 'F' | string;
  dateNaissance?: string;
  nationalite?: string;
  profession?: string;
  telephone: string;
  telephoneSecondaire?: string;
  email: string;
  adresse?: string;
  ville?: string;
  quartier?: string;
  photo?: string;
  statut: 'actif' | 'inactif' | string;
  schoolId?: string;
  etablissement?: string;
  childrenIds?: string[];
  lastLogin?: string;
  createdAt?: string;
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  // Dynamic fields fetched
  children?: any[];
  classes?: string[];
}

export interface ParentStudentRelation {
  id: string;
  parentId: string;
  studentId: string;
  relationship: 'Père' | 'Mère' | 'Tuteur légal' | 'Grand-parent' | 'Oncle' | 'Tante' | 'Autre responsable' | string;
  schoolId?: string;
  createdAt?: string;
  // Expanded fields
  student?: any;
}

export interface ParentNotification {
  id?: string;
  targetType: 'single' | 'multiple' | 'all';
  parentIds?: string[];
  title: string;
  message: string;
  schoolId?: string;
  sentBy?: string;
  createdAt?: string;
}

export interface ParentActivity {
  id: string;
  action: 'Création' | 'Modification' | "Association d'un enfant" | 'Suppression' | 'Restauration' | 'Connexion' | 'Déconnexion' | string;
  parentId?: string;
  parentName?: string;
  details?: string;
  performedBy: string;
  schoolId?: string;
  timestamp: string;
}
