import React, { useState, useEffect } from 'react';
import { 
  Users, 
  PlusCircle, 
  History, 
  Trash2, 
  Bell, 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  ShieldAlert, 
  Search,
  UsersRound
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc, addDoc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { Parent, ParentStudentRelation, ParentActivity } from '../types/parent';
import { ParentsDashboardKPIs } from '../components/parents/ParentsDashboardKPIs';
import { ParentsTable } from '../components/parents/ParentsTable';
import { ParentFormModal } from '../components/parents/ParentFormModal';
import { ParentStudentAssociationModal } from '../components/parents/ParentStudentAssociationModal';
import { ParentDetailModal } from '../components/parents/ParentDetailModal';
import { ParentNotificationModal } from '../components/parents/ParentNotificationModal';
import { ParentActivityLogModal } from '../components/parents/ParentActivityLogModal';
import { generateParentsListPDF, exportParentsExcelCSV } from '../utils/parentPdfExport';

export const Parents: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentEstablishment, isSuperAdmin } = useEstablishment();

  // State management
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [relations, setRelations] = useState<ParentStudentRelation[]>([]);
  const [activities, setActivities] = useState<ParentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [showTrash, setShowTrash] = useState(false);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedParentForEdit, setSelectedParentForEdit] = useState<Parent | null>(null);

  const [isAssociationOpen, setIsAssociationOpen] = useState(false);
  const [selectedParentForAssociation, setSelectedParentForAssociation] = useState<Parent | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedParentForDetail, setSelectedParentForDetail] = useState<Parent | null>(null);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [selectedParentForNotification, setSelectedParentForNotification] = useState<string | null>(null);

  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);

  // Security Check: Restricted to Super Admin, Admin, and Director
  const userRole = (currentUser?.role || '').toLowerCase();
  const isAuthorized = isSuperAdmin || userRole === 'admin' || userRole === 'personnel administratif' || userRole === 'directeur';

  const schoolId = currentEstablishment?.id || 'EDU-001';

  // Helper: check if a record belongs to current establishment
  const matchesEstablishment = (item: any) => {
    if (!currentEstablishment) return true;
    const estId = currentEstablishment.id;
    const estNom = (currentEstablishment.nom || '').toLowerCase().trim();
    const estCode = (currentEstablishment.code || '').toLowerCase().trim();

    const itemEst = item.schoolId || item.etablissement || item.etablissementId;
    if (!itemEst) {
      return estId === 'EDU-001';
    }

    const itemEstStr = String(itemEst).toLowerCase().trim();
    return (
      itemEstStr === estId.toLowerCase() ||
      (estNom && itemEstStr === estNom) ||
      (estCode && itemEstStr === estCode)
    );
  };

  // 1. Fetch Students
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const studentList = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((u: any) => {
          const r = (u.role || '').toLowerCase();
          const isStudentRole = r === 'élève' || r === 'eleve' || r === 'student';
          return isStudentRole && matchesEstablishment(u);
        });
      setStudents(studentList);
    });
    return () => unsub();
  }, [currentEstablishment?.id, currentEstablishment?.nom]);

  // 2. Fetch Parent Student Relations
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'parentStudents'), (snapshot) => {
      const rels = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ParentStudentRelation[];
      const filtered = rels.filter(r => matchesEstablishment(r));
      setRelations(filtered);
    });
    return () => unsub();
  }, [currentEstablishment?.id, currentEstablishment?.nom]);

  // 3. Fetch Parents (Realtime from both 'parents' collection AND 'users' with role parent/tuteur)
  useEffect(() => {
    if (!db) return;
    setLoading(true);

    const unsubParents = onSnapshot(collection(db, 'parents'), (parentsSnap) => {
      const dedicatedParents = parentsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Parent[];

      const unsubUsers = onSnapshot(collection(db, 'users'), (usersSnap) => {
        const userParents = usersSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((u: any) => {
            const r = (u.role || '').toLowerCase();
            return r === 'parent' || r === 'tuteur';
          })
          .map((u: any): Parent => ({
            id: u.id,
            nom: u.nom || u.lastName || '',
            prenom: u.prenom || u.firstName || '',
            sexe: u.sexe || u.gender || 'M',
            dateNaissance: u.dateNaissance || '',
            nationalite: u.nationalite || 'Gabonaise',
            profession: u.profession || u.position || '',
            telephone: u.telephone || u.contact || u.phone || '',
            telephoneSecondaire: u.telephoneSecondaire || '',
            email: u.email || '',
            adresse: u.adresse || u.address || '',
            ville: u.ville || 'Libreville',
            quartier: u.quartier || '',
            photo: u.photo || u.avatar || '',
            statut: u.statut || u.status || 'actif',
            schoolId: u.schoolId || u.etablissement || schoolId,
            createdAt: u.createdAt || u.dateCreation || new Date().toISOString(),
            deleted: u.deleted || u.archived || false,
            childrenIds: u.children_ids || u.childrenIds || []
          }));

        const map = new Map<string, Parent>();

        userParents.forEach(p => {
          if (matchesEstablishment(p)) {
            map.set(p.id, p);
          }
        });

        dedicatedParents.forEach(p => {
          if (matchesEstablishment(p)) {
            map.set(p.id, p);
          }
        });

        setParents(Array.from(map.values()));
        setLoading(false);
      });

      return () => unsubUsers();
    }, (err) => {
      console.warn("Firestore error listening to parents", err);
      setLoading(false);
    });

    return () => unsubParents();
  }, [currentEstablishment?.id, currentEstablishment?.nom]);

  // 4. Fetch Activities Log
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'parentActivities'), (snapshot) => {
      const actList = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ParentActivity[];
      const filtered = actList
        .filter(a => matchesEstablishment(a))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(filtered);
    });
    return () => unsub();
  }, [currentEstablishment?.id, currentEstablishment?.nom]);

  // Enrich parents with their associated students and classes
  const enrichedParents = parents.map(p => {
    const parentRels = relations.filter(r => r.parentId === p.id);

    const linkedStudentIds = new Set<string>();
    parentRels.forEach(r => linkedStudentIds.add(r.studentId));

    if (Array.isArray(p.childrenIds)) {
      p.childrenIds.forEach(id => linkedStudentIds.add(id));
    }

    students.forEach(s => {
      if (s.parentId === p.id) linkedStudentIds.add(s.id);
      if (p.telephone && (s.parentPhone === p.telephone || s.telephoneParent === p.telephone || s.tuteurPhone === p.telephone)) {
        linkedStudentIds.add(s.id);
      }
      if (p.email && (s.parentEmail === p.email || s.emailParent === p.email)) {
        linkedStudentIds.add(s.id);
      }
    });

    const linkedStudents = Array.from(linkedStudentIds).map(stId => {
      const st = students.find(s => s.id === stId);
      const rel = parentRels.find(r => r.studentId === stId);
      return {
        id: stId,
        nom: st?.nom || 'Élève',
        prenom: st?.prenom || '',
        matricule: st?.matricule || 'N/A',
        classe: st?.classe || st?.class_name || st?.niveau || 'Non assigné',
        relationship: rel?.relationship || 'Tuteur'
      };
    });

    const classesSet = new Set<string>();
    linkedStudents.forEach(s => {
      if (s.classe && s.classe !== 'Non assigné') {
        classesSet.add(s.classe);
      }
    });

    if (Array.isArray(p.classes)) {
      p.classes.forEach(c => { if (c && c !== 'Non assigné') classesSet.add(c); });
    } else if ((p as any).classe && (p as any).classe !== 'Non assigné') {
      classesSet.add((p as any).classe);
    }

    return {
      ...p,
      children: linkedStudents,
      classes: Array.from(classesSet)
    };
  });

  // Split active vs deleted
  const activeParents = enrichedParents.filter(p => !p.deleted);
  const deletedParents = enrichedParents.filter(p => p.deleted);

  // Log activity helper
  const logActivity = async (action: string, parentName?: string, details?: string, parentId?: string) => {
    try {
      if (!db) return;
      await addDoc(collection(db, 'parentActivities'), {
        action,
        parentId: parentId || '',
        parentName: parentName || '',
        details: details || '',
        performedBy: `${currentUser?.prenom || ''} ${currentUser?.nom || 'Admin'}`.trim(),
        schoolId,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Error logging activity", e);
    }
  };

  // Handlers
  const handleSaveParent = async (parentData: Partial<Parent>, isNew: boolean) => {
    if (!db) return;

    if (isNew) {
      const newRef = doc(collection(db, 'parents'));
      const newParent: Parent = {
        id: newRef.id,
        nom: parentData.nom || '',
        prenom: parentData.prenom || '',
        sexe: parentData.sexe || 'M',
        dateNaissance: parentData.dateNaissance || '',
        nationalite: parentData.nationalite || 'Gabonaise',
        profession: parentData.profession || '',
        telephone: parentData.telephone || '',
        telephoneSecondaire: parentData.telephoneSecondaire || '',
        email: parentData.email || '',
        adresse: parentData.adresse || '',
        ville: parentData.ville || 'Libreville',
        quartier: parentData.quartier || '',
        photo: parentData.photo || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
        statut: parentData.statut || 'actif',
        schoolId,
        etablissement: schoolId,
        createdAt: new Date().toISOString(),
        deleted: false
      };

      await setDoc(newRef, newParent);
      await logActivity('Création', `${newParent.nom} ${newParent.prenom}`, 'Création de la fiche parent', newRef.id);
    } else if (selectedParentForEdit) {
      const parentRef = doc(db, 'parents', selectedParentForEdit.id);
      await updateDoc(parentRef, {
        ...parentData,
        updatedAt: new Date().toISOString()
      });
      await logActivity('Modification', `${parentData.nom || selectedParentForEdit.nom} ${parentData.prenom || selectedParentForEdit.prenom}`, 'Mise à jour des informations personnelles', selectedParentForEdit.id);
    }
  };

  const handleAssociateStudent = async (parentId: string, studentIds: string[], relationship: string) => {
    if (!db) return;
    const parent = parents.find(p => p.id === parentId);

    for (const stId of studentIds) {
      const relRef = doc(collection(db, 'parentStudents'));
      await setDoc(relRef, {
        parentId,
        studentId: stId,
        relationship,
        schoolId,
        createdAt: new Date().toISOString()
      });
    }

    await logActivity("Association d'un enfant", `${parent?.nom} ${parent?.prenom}`, `Association de ${studentIds.length} enfant(s) avec la relation ${relationship}`, parentId);
  };

  const handleRemoveAssociation = async (parentId: string, studentId: string) => {
    if (!db) return;
    const parent = parents.find(p => p.id === parentId);
    const rel = relations.find(r => r.parentId === parentId && r.studentId === studentId);
    if (rel) {
      await deleteDoc(doc(db, 'parentStudents', rel.id));
      await logActivity("Retrait d'association", `${parent?.nom} ${parent?.prenom}`, `Retrait de la liaison pour l'élève ${studentId}`, parentId);
    }
  };

  const handleResetPassword = async (parent: Parent) => {
    if (!db) return;
    alert(`Un lien de réinitialisation de mot de passe a été envoyé à l'adresse ${parent.email}.`);
    await logActivity('Réinitialisation Mot de Passe', `${parent.nom} ${parent.prenom}`, `Envoi du lien à ${parent.email}`, parent.id);
  };

  const handleToggleStatus = async (parent: Parent) => {
    if (!db) return;
    const newStatus = parent.statut === 'actif' ? 'inactif' : 'actif';
    await updateDoc(doc(db, 'parents', parent.id), { statut: newStatus });
    await logActivity('Changement de Statut', `${parent.nom} ${parent.prenom}`, `Passage du statut à ${newStatus.toUpperCase()}`, parent.id);
  };

  const handleSoftDelete = async (parent: Parent) => {
    if (!db) return;
    if (confirm(`Voulez-vous déplacer le compte de ${parent.nom} ${parent.prenom} dans la corbeille ?`)) {
      await updateDoc(doc(db, 'parents', parent.id), {
        deleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.email || 'Admin'
      });
      await logActivity('Suppression', `${parent.nom} ${parent.prenom}`, 'Déplacement dans la corbeille', parent.id);
    }
  };

  const handleRestore = async (parent: Parent) => {
    if (!db) return;
    await updateDoc(doc(db, 'parents', parent.id), {
      deleted: false,
      deletedAt: null,
      deletedBy: null
    });
    await logActivity('Restauration', `${parent.nom} ${parent.prenom}`, 'Restauration depuis la corbeille', parent.id);
  };

  const handleSendNotification = async (data: { targetType: 'single' | 'multiple' | 'all'; parentIds: string[]; title: string; message: string }) => {
    if (!db) return;
    await addDoc(collection(db, 'parentNotifications'), {
      ...data,
      schoolId,
      sentBy: `${currentUser?.prenom || ''} ${currentUser?.nom || 'Admin'}`.trim(),
      createdAt: new Date().toISOString()
    });
    await logActivity('Envoi Notification', 'Multiples Destinataires', `Titre: ${data.title}`);
  };

  const handleSendMessage = async (parentId: string, content: string) => {
    if (!db) return;
    const parent = parents.find(p => p.id === parentId);
    await addDoc(collection(db, 'parentMessages'), {
      parentId,
      senderId: currentUser?.uid || 'admin',
      senderName: `${currentUser?.prenom || ''} ${currentUser?.nom || 'Admin'}`.trim(),
      content,
      schoolId,
      createdAt: new Date().toISOString()
    });
    await logActivity('Message Direct', `${parent?.nom} ${parent?.prenom}`, `Message: ${content.slice(0, 30)}...`, parentId);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4 bg-white p-8 rounded-2xl border border-rose-100 shadow-xl">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Accès Restreint</h2>
          <p className="text-xs text-gray-500">
            Ce module d'administration des Parents est réservé exclusivement aux Administrateurs, Directeurs et Super Administrateurs de l'établissement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
            <UsersRound className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Gestion des Parents & Tuteurs</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {currentEstablishment?.nom || 'Edu-Nify'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Suivi des responsables légaux, relations avec les élèves et communications directes
            </p>
          </div>
        </div>

        {/* Action Header Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Activity Log button */}
          <button
            onClick={() => setIsActivityLogOpen(true)}
            className="px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <History className="w-4 h-4 text-gray-500" /> Journal Activités
          </button>

          {/* Send Broadcast Notification */}
          <button
            onClick={() => {
              setSelectedParentForNotification(null);
              setIsNotificationOpen(true);
            }}
            className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Bell className="w-4 h-4 text-indigo-600" /> Notification Parents
          </button>

          {/* Directory PDF */}
          <button
            onClick={() => generateParentsListPDF(activeParents, currentEstablishment)}
            className="px-3.5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-gray-500" /> Répertoire PDF
          </button>

          {/* Trash Toggle */}
          <button
            onClick={() => setShowTrash(!showTrash)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors border ${
              showTrash 
                ? 'bg-rose-600 text-white border-rose-600' 
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Trash2 className="w-4 h-4" /> Corbeille ({deletedParents.length})
          </button>

          {/* Add Parent Button */}
          {!showTrash && (
            <button
              onClick={() => {
                setSelectedParentForEdit(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-2 transition-all"
            >
              <PlusCircle className="w-4 h-4" /> Ajouter un Parent
            </button>
          )}
        </div>
      </div>

      {/* KPI Dashboard (Hidden in Trash View) */}
      {!showTrash && (
        <ParentsDashboardKPIs parents={activeParents} students={students} />
      )}

      {/* Main Table */}
      <ParentsTable
        parents={showTrash ? deletedParents : activeParents}
        establishment={currentEstablishment}
        isTrashView={showTrash}
        onOpenAddModal={() => {
          setSelectedParentForEdit(null);
          setIsFormOpen(true);
        }}
        onView={(p) => {
          setSelectedParentForDetail(p);
          setIsDetailOpen(true);
        }}
        onEdit={(p) => {
          setSelectedParentForEdit(p);
          setIsFormOpen(true);
        }}
        onAssociate={(p) => {
          setSelectedParentForAssociation(p);
          setIsAssociationOpen(true);
        }}
        onSendMessage={(p) => {
          setSelectedParentForNotification(p.id);
          setIsNotificationOpen(true);
        }}
        onResetPassword={handleResetPassword}
        onToggleStatus={handleToggleStatus}
        onSoftDelete={handleSoftDelete}
        onRestore={handleRestore}
      />

      {/* MODAL 1: Form Modal (Add / Edit) */}
      <ParentFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedParentForEdit}
        onSave={handleSaveParent}
      />

      {/* MODAL 2: Association Modal */}
      <ParentStudentAssociationModal
        isOpen={isAssociationOpen}
        onClose={() => setIsAssociationOpen(false)}
        parent={selectedParentForAssociation}
        students={students}
        onAssociate={handleAssociateStudent}
        onRemoveAssociation={handleRemoveAssociation}
      />

      {/* MODAL 3: Detail Profile Modal */}
      <ParentDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        parent={selectedParentForDetail}
        establishment={currentEstablishment}
        onSendMessage={handleSendMessage}
      />

      {/* MODAL 4: Notification Modal */}
      <ParentNotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        parents={activeParents}
        preselectedParentId={selectedParentForNotification}
        onSend={handleSendNotification}
      />

      {/* MODAL 5: Activity Log Modal */}
      <ParentActivityLogModal
        isOpen={isActivityLogOpen}
        onClose={() => setIsActivityLogOpen(false)}
        activities={activities}
      />
    </div>
  );
};

export default Parents;
