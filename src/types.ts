export interface User {
  id?: string;
  nom: string;
  prenom: string;
  role: string;
  matricule: string;
  biographie?: string;
  status?: string;
  diploma?: string;
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
