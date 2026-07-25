export type TrashItemType =
  | 'eleve'
  | 'parent'
  | 'enseignant'
  | 'personnel'
  | 'classe'
  | 'matiere'
  | 'emploi_du_temps'
  | 'note'
  | 'bulletin'
  | 'devoir'
  | 'presence'
  | 'controle_acces'
  | 'story'
  | 'publication'
  | 'commentaire'
  | 'reaction'
  | 'sondage'
  | 'election'
  | 'candidat'
  | 'vote'
  | 'document'
  | 'livre'
  | 'emprunt'
  | 'message'
  | 'notification'
  | 'evenement'
  | 'paiement'
  | 'facture'
  | 'parametre'
  | 'autre';

export type TrashModule =
  | 'Élèves'
  | 'Parents'
  | 'Enseignants'
  | 'Personnel'
  | 'Classes'
  | 'Matières'
  | 'Emplois du temps'
  | 'Notes'
  | 'Bulletins'
  | 'Devoirs'
  | 'Présences'
  | 'Contrôle d\'accès'
  | 'Histoire & Fil'
  | 'Publications'
  | 'Sondages'
  | 'Élections'
  | 'Documents'
  | 'Bibliothèque'
  | 'Messages'
  | 'Notifications'
  | 'Événements'
  | 'Paiements & Factures'
  | 'Paramètres'
  | 'Autre';

export interface TrashItem {
  id: string; // Trash document ID in 'trash' collection
  trashId?: string;
  module: TrashModule | string;
  entityType: TrashItemType | string;
  entityId: string;
  title: string;
  content?: string;
  authorName?: string;
  authorId?: string;
  originalCollection: string;
  originalDocumentId: string;
  originalData: any; // Complete copy of original document payload
  deletedBy: string; // User ID or email
  deletedByName: string; // User full name
  deletedAt: any; // Firestore Timestamp or ISO string
  deletedReason?: string;
  schoolId?: string;
  status: 'deleted' | 'restored' | 'purged';
  expiresAt: any; // Expiration date or timestamp
  metadata?: {
    authorName?: string;
    createdAt?: any;
    subItemsCount?: number;
    fileUrls?: string[];
    schoolName?: string;
    [key: string]: any;
  };
}

export interface TrashRetentionSettings {
  retentionDays: number; // e.g. 30, 60, 90, 180, 365 or -1 for 'never'
  lastPurgedAt?: any;
  updatedAt?: any;
  updatedBy?: string;
}
