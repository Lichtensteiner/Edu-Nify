import React, { useState, useEffect } from 'react';
import { UserCheck, ShieldAlert, Search, RefreshCw, CheckCircle2, Clock, MapPin, Camera, AlertTriangle, ArrowRight, UserPlus, Link2 } from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UnknownFace } from '../../utils/faceBiometrics';
import { useAuth } from '../../contexts/AuthContext';

interface UnknownFacesManagerProps {
  schoolId: string;
}

export default function UnknownFacesManager({ schoolId }: UnknownFacesManagerProps) {
  const { currentUser } = useAuth();
  const [unknowns, setUnknowns] = useState<UnknownFace[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Modal state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnknown, setSelectedUnknown] = useState<UnknownFace | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) return;

    // Listen to unknownFaces
    const q = query(
      collection(db, 'unknownFaces'),
      where('schoolId', '==', schoolId),
      where('status', '==', 'unidentified')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UnknownFace));
      // Sort most recently seen first
      list.sort((a, b) => new Date(b.lastSeenAt || b.firstSeenAt).getTime() - new Date(a.lastSeenAt || a.firstSeenAt).getTime());
      setUnknowns(list);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching unknown faces:", err);
      setLoading(false);
    });

    // Fetch candidate users to identify
    fetchUsers();

    return () => unsubscribe();
  }, [schoolId]);

  const fetchUsers = async () => {
    try {
      const qUsers = query(collection(db, 'users'));
      const snap = await getDocs(qUsers);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllUsers(list);
    } catch (e) {
      console.error("Error fetching users for merging:", e);
    }
  };

  const handleMergeFaceToUser = async () => {
    if (!selectedUnknown || !selectedUser || isMerging) return;
    setIsMerging(true);
    setSuccessMessage(null);

    try {
      const now = new Date().toISOString();
      const adminName = currentUser?.nom ? `${currentUser.prenom || ''} ${currentUser.nom}` : (currentUser?.email || 'Administrateur');

      // 1. Update unknownFaces document
      await updateDoc(doc(db, 'unknownFaces', selectedUnknown.id), {
        status: 'merged',
        mergedToUserId: selectedUser.id,
        mergedAt: now,
        mergedBy: adminName
      });

      // 2. Promote embedding vector into biometricProfiles for future auto-matching
      await setDoc(doc(db, 'biometricProfiles', selectedUser.id), {
        id: selectedUser.id,
        userId: selectedUser.id,
        nom: selectedUser.nom || selectedUser.displayName || 'Élève',
        prenom: selectedUser.prenom || '',
        role: selectedUser.role || 'élève',
        classe: selectedUser.classe || selectedUser.grade || '',
        matricule: selectedUser.matricule || '',
        photo: selectedUnknown.photo || selectedUser.photoURL || '',
        schoolId: schoolId,
        embedding: selectedUnknown.embedding,
        enrolledAt: now,
        enrolledBy: `Identification Admin (${adminName})`
      }, { merge: true });

      // Update user doc flag
      try {
        await updateDoc(doc(db, 'users', selectedUser.id), {
          hasBiometrics: true,
          biometricsEnrolledAt: now
        });
      } catch (e) {}

      // 3. Batch update past accessLogs and entryExitLogs attributed to this unknown code
      const accessQ = query(
        collection(db, 'accessLogs'),
        where('userId', '==', selectedUnknown.unknownCode)
      );
      const accessSnap = await getDocs(accessQ);
      
      const batch = writeBatch(db);
      accessSnap.docs.forEach(d => {
        batch.update(doc(db, 'accessLogs', d.id), {
          userId: selectedUser.id,
          nom: selectedUser.nom || '',
          prenom: selectedUser.prenom || '',
          classe: selectedUser.classe || selectedUser.grade || '',
          role: selectedUser.role || 'élève',
          status: 'identifié_a_posteriori'
        });
      });

      // Update entryExitLogs
      const eeQ = query(
        collection(db, 'entryExitLogs'),
        where('userId', '==', selectedUnknown.unknownCode)
      );
      const eeSnap = await getDocs(eeQ);
      eeSnap.docs.forEach(d => {
        batch.update(doc(db, 'entryExitLogs', d.id), {
          userId: selectedUser.id,
          classe: selectedUser.classe || selectedUser.grade || '',
          role: selectedUser.role || 'élève'
        });
      });

      await batch.commit();

      setSuccessMessage(`Le profil visage ${selectedUnknown.unknownCode} a été lié avec succès à ${selectedUser.prenom || ''} ${selectedUser.nom}! Tout l'historique a été réattribué.`);
      setIsMerging(false);
      setSelectedUnknown(null);
      setSelectedUser(null);
    } catch (err: any) {
      console.error("Error merging unknown face:", err);
      alert("Erreur lors de la fusion du profil: " + err.message);
      setIsMerging(false);
    }
  };

  const filteredUnknowns = unknowns.filter(u =>
    u.unknownCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.gateId && u.gateId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredUsers = allUsers.filter(u => {
    const full = `${u.prenom || ''} ${u.nom || ''} ${u.classe || ''} ${u.email || ''}`.toLowerCase();
    return full.includes(userSearch.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white rounded-3xl p-6 shadow-xl border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
            <ShieldAlert className="w-8 h-8 text-amber-200" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Registre des Visages Non Reconnus</h2>
            <p className="text-xs text-amber-100 mt-0.5">
              Gestion intelligente des profils temporaires capturés au portail. Identifiez un visage pour réattribuer automatiquement tout l'historique de présence.
            </p>
          </div>
        </div>

        <div className="bg-amber-900/40 border border-amber-400/30 px-5 py-2.5 rounded-2xl text-center">
          <span className="text-2xl font-black text-amber-200">{unknowns.length}</span>
          <span className="text-[11px] font-bold text-amber-100 block uppercase tracking-wider">Visages en Attente</span>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-sm text-emerald-700 dark:text-emerald-300 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
          <p className="font-semibold">{successMessage}</p>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un code inconnu (ex: UNKNOWN_0001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Unknown Faces Cards Grid */}
      {loading ? (
        <div className="py-12 flex justify-center items-center text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      ) : filteredUnknowns.length === 0 ? (
        <div className="p-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700">
          <UserCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Aucun visage inconnu en attente</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tous les visages détectés au portail sont identifiés ou déjà attribués aux élèves de l'établissement.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUnknowns.map((u) => (
            <div
              key={u.id}
              className="bg-white dark:bg-gray-800 rounded-3xl border border-amber-200/80 dark:border-amber-900/50 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded-full font-black text-xs border border-amber-300 dark:border-amber-800">
                    {u.unknownCode}
                  </span>
                  <span className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock size={12} /> Détecté {u.seenCount || 1} fois
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <img
                    src={u.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={u.unknownCode}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-md shrink-0"
                  />
                  <div className="space-y-1 text-xs">
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <MapPin size={12} className="text-amber-500" /> {u.gateId || 'Portail Principal'}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      <strong>Dernière vue:</strong> {new Date(u.lastSeenAt || u.firstSeenAt).toLocaleString('fr-FR')}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-[10px]">
                      Appareil: {u.deviceId || 'Scanner mobile 01'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                <button
                  onClick={() => setSelectedUnknown(u)}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Link2 size={14} /> Identifier & Associer à un Élève
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Identification & Fusion Modal */}
      {selectedUnknown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">Associer {selectedUnknown.unknownCode}</h3>
                  <p className="text-xs text-amber-100">Sélectionnez le membre réel pour fusionner l'historique biométrique</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedUnknown(null); setSelectedUser(null); }}
                className="p-1.5 rounded-xl hover:bg-white/10 text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Selected Unknown Card Header */}
              <div className="flex items-center gap-4 bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                <img
                  src={selectedUnknown.photo}
                  alt={selectedUnknown.unknownCode}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-amber-400"
                />
                <div className="text-xs space-y-0.5">
                  <span className="font-black text-amber-800 dark:text-amber-300">{selectedUnknown.unknownCode}</span>
                  <p className="text-gray-600 dark:text-gray-300">Portail: {selectedUnknown.gateId || 'Portail Principal'}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-[10px]">Détecté {selectedUnknown.seenCount} fois</p>
                </div>
              </div>

              {/* User Search Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                  Rechercher un élève, enseignant ou agent dans l'établissement:
                </label>
                <input
                  type="text"
                  placeholder="Tapez un nom, prénom ou classe (ex: Martin, 6ème A)..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* User Selection List */}
              <div className="max-h-56 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-2xl p-2 bg-gray-50/50 dark:bg-gray-900/40">
                {filteredUsers.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">Aucun utilisateur trouvé</p>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = selectedUser?.id === u.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-500 shadow-sm'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={u.photoURL || u.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={u.nom}
                            className="w-10 h-10 rounded-full object-cover border border-gray-300"
                          />
                          <div className="text-xs">
                            <p className="font-extrabold text-gray-900 dark:text-white">
                              {u.prenom || ''} {u.nom || u.displayName}
                            </p>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 capitalize">
                              {u.role || 'Élève'} {u.classe ? `• ${u.classe}` : ''}
                            </span>
                          </div>
                        </div>

                        {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                      </div>
                    );
                  })
                )}
              </div>

              {selectedUser && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Association sélectionnée:
                  </p>
                  <p className="mt-1">
                    {selectedUnknown.unknownCode} ➔ <strong>{selectedUser.prenom} {selectedUser.nom}</strong> ({selectedUser.classe || selectedUser.role})
                  </p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={() => { setSelectedUnknown(null); setSelectedUser(null); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Annuler
              </button>

              <button
                onClick={handleMergeFaceToUser}
                disabled={!selectedUser || isMerging}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isMerging ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link2 size={14} />}
                {isMerging ? 'Fusion en cours...' : 'Confirmer & Fusionner l\'Historique'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
