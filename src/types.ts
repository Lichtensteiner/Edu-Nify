export interface User {
  id?: string;
  uid?: string;
  nom: string;
  prenom: string;
  role: string;
  matricule?: string;
  biographie?: string;
  status?: string;
  diploma?: string;
  email?: string;
  etablissement?: string;
  classe?: string;
  classes?: string[];
  matiere?: string;
  matieres?: string[];
  contact?: string;
  address?: string;
  adresse?: string;
  sexe?: string;
  dateNaissance?: string;
  date_naissance?: string;
  birthDate?: string;
  lieuNaissance?: string;
  lieu_naissance?: string;
  birthPlace?: string;
  parent_id?: string;
  parentId?: string;
  parent_nom?: string;
  parentNom?: string;
  nom_parent?: string;
  parentName?: string;
  tuteur_nom?: string;
  tuteurNom?: string;
  parent_phone?: string;
  telephone_parent?: string;
  parentPhone?: string;
  tuteurPhone?: string;
  parent_email?: string;
  parentEmail?: string;
  email_parent?: string;
  absences?: number;
  retards?: number;
  enfantClasse?: string;
  [key: string]: any;
}

export interface Dossier {
  id: string;
  title: string;
  category: "Orientation" | "Administratif" | "Juridique";
  agentRole: "orientation" | "administratif" | "juridique";
  description: string;
  createdAt: string;
  userName: string;
}

export interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
}
