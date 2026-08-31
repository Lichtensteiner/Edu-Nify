import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  UserPlus, 
  Sparkles, 
  X, 
  Megaphone, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Building2, 
  ShieldCheck, 
  Radio, 
  Layers
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { useNotification } from '../contexts/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';

export interface FlashItem {
  id: string;
  source: 'announcement' | 'user' | 'alert';
  title?: string;
  text: string;
  authorName?: string;
  authorRole?: string;
  etablissementId: string;
  etablissementNom?: string;
  date?: any;
  type?: 'flash' | 'urgent' | 'info' | 'event' | 'registration';
  role?: string;
}

export default function NewUserAnnouncement() {
  const { currentUser } = useAuth();
  const { t, tData } = useLanguage();
  const { currentEstablishment, activeEstablishmentId, establishments, isSuperAdmin } = useEstablishment();
  const { notifySuccess, notifyError } = useNotification();

  const [flashItems, setFlashItems] = useState<FlashItem[]>([]);
  const [visible, setVisible] = useState(true);
  const [superAdminViewMode, setSuperAdminViewMode] = useState<'selected' | 'all'>('selected');
  const [showManageModal, setShowManageModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New announcement form state
  const [newText, setNewText] = useState('');
  const [newType, setNewType] = useState<'flash' | 'urgent' | 'info' | 'event'>('flash');
  const [targetEstId, setTargetEstId] = useState<string>(activeEstablishmentId || 'EDU-001');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine effective establishment for standard users
  const effectiveEstId = isSuperAdmin
    ? (superAdminViewMode === 'all' ? 'ALL' : (activeEstablishmentId || currentEstablishment?.id || 'EDU-001'))
    : (currentUser?.etablissement || currentEstablishment?.id || 'EDU-001');

  // Update targetEstId when activeEstablishment changes
  useEffect(() => {
    if (activeEstablishmentId) {
      setTargetEstId(activeEstablishmentId);
    }
  }, [activeEstablishmentId]);

  // Subscribe to real-time announcements & recent users with strict tenant isolation
  useEffect(() => {
    // 1. Listen to announcements collection
    const unsubAnnouncements = onSnapshot(
      collection(db, 'announcements'),
      (snapshot) => {
        const rawAnnouncements = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as any[];

        // 2. Listen to users collection for recent registrations
        const unsubUsers = onSnapshot(
          collection(db, 'users'),
          (userSnapshot) => {
            const rawUsers = userSnapshot.docs.map(d => ({
              id: d.id,
              ...d.data()
            })) as any[];

            // Compute 48 hours cutoff for new users
            const twoDaysAgo = new Date();
            twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);
            const cutoffTime = twoDaysAgo.getTime();

            const items: FlashItem[] = [];

            // A) Process Announcements with Multi-Tenant Isolation
            rawAnnouncements.forEach((ann) => {
              const annEst = ann.etablissement || 'EDU-001';
              const isGlobal = ann.etablissement === 'ALL';

              // Isolation rule:
              // - Super Admin: if 'all', sees all. If 'selected', sees matching or global.
              // - Standard user: MUST strictly match user's establishment or global!
              let matches = false;
              if (isSuperAdmin) {
                if (superAdminViewMode === 'all') {
                  matches = true;
                } else {
                  matches = annEst === effectiveEstId || isGlobal;
                }
              } else {
                matches = annEst === effectiveEstId || isGlobal;
              }

              if (matches && ann.text && !ann.deleted && ann.active !== false) {
                const estObj = establishments.find(e => e.id === annEst);
                items.push({
                  id: `ann-${ann.id}`,
                  source: 'announcement',
                  title: ann.title,
                  text: ann.text,
                  authorName: ann.authorName || 'Direction',
                  authorRole: ann.authorRole,
                  etablissementId: annEst,
                  etablissementNom: isGlobal ? 'Tous Établissements' : (estObj?.nom || annEst),
                  date: ann.createdAt || ann.date,
                  type: ann.type || 'flash'
                });
              }
            });

            // B) Process Recent Users Registrations with Multi-Tenant Isolation
            rawUsers.forEach((u) => {
              const userEst = u.etablissement || 'EDU-001';
              let matches = false;
              if (isSuperAdmin) {
                if (superAdminViewMode === 'all') {
                  matches = true;
                } else {
                  matches = userEst === effectiveEstId;
                }
              } else {
                matches = userEst === effectiveEstId;
              }

              // Check if user registration is recent (within 48 hours)
              let isRecent = false;
              if (u.date_creation) {
                const userDate = new Date(u.date_creation).getTime();
                if (!isNaN(userDate) && userDate >= cutoffTime) {
                  isRecent = true;
                }
              }

              if (matches && isRecent && (u.prenom || u.nom)) {
                const estObj = establishments.find(e => e.id === userEst);
                items.push({
                  id: `usr-${u.id}`,
                  source: 'user',
                  text: `Nouvelle inscription : ${u.prenom || ''} ${u.nom || ''} (${tData ? tData(u.role || 'eleve') : u.role})`,
                  authorName: `${u.prenom || ''} ${u.nom || ''}`.trim(),
                  etablissementId: userEst,
                  etablissementNom: estObj?.nom || userEst,
                  date: u.date_creation,
                  type: 'registration',
                  role: u.role
                });
              }
            });

            // Sort: Urgent & Flash announcements first, then recent
            items.sort((a, b) => {
              if (a.type === 'urgent' && b.type !== 'urgent') return -1;
              if (b.type === 'urgent' && a.type !== 'urgent') return 1;
              return 0;
            });

            setFlashItems(items);
          },
          (err) => console.error("Error listening to users for Flash Info:", err)
        );

        return () => unsubUsers();
      },
      (err) => console.error("Error listening to announcements:", err)
    );

    return () => unsubAnnouncements();
  }, [effectiveEstId, isSuperAdmin, superAdminViewMode, establishments, tData]);

  // Handle Quick Add Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      const senderName = currentUser.prenom || currentUser.nom
        ? `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim()
        : currentUser.email?.split('@')[0] || 'Admin';

      const finalEst = isSuperAdmin ? targetEstId : (currentUser.etablissement || currentEstablishment?.id || 'EDU-001');

      await addDoc(collection(db, 'announcements'), {
        text: newText.trim(),
        type: newType,
        authorId: currentUser.id,
        authorName: senderName,
        authorRole: currentUser.role || 'admin',
        createdAt: serverTimestamp(),
        date: new Date().toISOString(),
        etablissement: finalEst,
        active: true
      });

      notifySuccess("Flash Info diffusé avec succès aux utilisateurs cibles.");
      setNewText('');
      setShowAddModal(false);
    } catch (err) {
      console.error("Error broadcasting flash info:", err);
      notifyError("Impossible de publier le message Flash Info.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Announcement
  const handleDeleteAnnouncement = async (item: FlashItem) => {
    if (!item.id.startsWith('ann-')) return;
    const realDocId = item.id.replace('ann-', '');

    if (!window.confirm("Voulez-vous supprimer ce message du bandeau Flash Info ?")) return;

    try {
      await deleteDoc(doc(db, 'announcements', realDocId));
      notifySuccess("Message retiré du Flash Info.");
    } catch (err) {
      console.error("Error deleting announcement:", err);
      notifyError("Erreur lors de la suppression de l'annonce.");
    }
  };

  const canManage = isSuperAdmin || currentUser?.role === 'admin' || currentUser?.role === 'directeur';

  if (flashItems.length === 0 && !canManage) return null;
  if (!visible) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-2.5 px-4 rounded-2xl shadow-md border border-indigo-500/30 mb-6 transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Flash Info Badge / Title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-xs animate-pulse">
            <Radio size={16} className="text-white" />
          </div>
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-[11px] uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded text-amber-300">
                Flash Info
              </span>
              {isSuperAdmin && (
                <button
                  onClick={() => setSuperAdminViewMode(superAdminViewMode === 'selected' ? 'all' : 'selected')}
                  className="px-2 py-0.5 rounded bg-indigo-600/60 hover:bg-indigo-600 text-[10px] font-bold text-white transition-all flex items-center gap-1 cursor-pointer"
                  title="Basculer entre la vue globale et l'établissement actif"
                >
                  <Layers size={10} />
                  {superAdminViewMode === 'all' ? 'Tous les Campus' : (currentEstablishment?.nom || 'Campus')}
                </button>
              )}
            </div>
            {!isSuperAdmin && currentEstablishment && (
              <span className="text-[9.5px] text-indigo-300/80 font-bold flex items-center gap-1 truncate max-w-[140px]">
                <Building2 size={10} className="shrink-0" />
                {currentEstablishment.nom}
              </span>
            )}
          </div>
        </div>

        {/* Marquee Ticker Area */}
        <div className="flex-1 overflow-hidden py-0.5">
          {flashItems.length === 0 ? (
            <div className="text-xs text-indigo-200/70 italic font-medium flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Aucun message actif pour <strong>{currentEstablishment?.nom || 'votre établissement'}</strong>. Les alertes et inscriptions s'afficheront ici en direct.</span>
            </div>
          ) : (
            <div className="animate-marquee whitespace-nowrap flex items-center gap-10">
              {flashItems.map((item, idx) => (
                <div key={item.id || idx} className="inline-flex items-center gap-2 text-xs">
                  {item.type === 'urgent' && (
                    <span className="px-2 py-0.5 bg-rose-500 text-white rounded text-[10px] font-black uppercase tracking-wider animate-bounce flex items-center gap-1">
                      <AlertTriangle size={11} /> Urgent
                    </span>
                  )}
                  {item.type === 'flash' && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={11} /> Flash
                    </span>
                  )}
                  {item.type === 'registration' && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <UserPlus size={11} /> Inscription
                    </span>
                  )}
                  {item.type === 'info' && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Megaphone size={11} /> Avis
                    </span>
                  )}

                  {/* Super Admin establishment tag */}
                  {isSuperAdmin && superAdminViewMode === 'all' && (
                    <span className="px-1.5 py-0.5 bg-white/10 text-indigo-200 rounded text-[10px] font-bold">
                      [{item.etablissementNom}]
                    </span>
                  )}

                  <span className="font-medium text-gray-100">
                    {item.text}
                  </span>

                  {item.authorName && item.source === 'announcement' && (
                    <span className="text-[10.5px] text-indigo-300/80 font-bold">
                      — {item.authorName}
                    </span>
                  )}
                </div>
              ))}

              {/* Duplicate for smooth infinite loop if small list */}
              {flashItems.length > 0 && flashItems.length < 4 && flashItems.map((item, idx) => (
                <div key={`dup-${item.id || idx}`} className="inline-flex items-center gap-2 text-xs opacity-95">
                  {item.type === 'urgent' && (
                    <span className="px-2 py-0.5 bg-rose-500 text-white rounded text-[10px] font-black uppercase">
                      Urgent
                    </span>
                  )}
                  {item.type === 'flash' && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-black">
                      Flash
                    </span>
                  )}
                  {item.type === 'registration' && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-black">
                      Inscription
                    </span>
                  )}
                  <span className="font-medium text-gray-100">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons: Add Flash (Admin/SuperAdmin) & Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          {canManage && (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                title="Publier un message Flash Info"
              >
                <Plus size={14} />
                <span className="hidden md:inline">Diffuser</span>
              </button>
              {flashItems.some(f => f.source === 'announcement') && (
                <button
                  onClick={() => setShowManageModal(true)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
                  title="Gérer les annonces actives"
                >
                  <Megaphone size={14} />
                </button>
              )}
            </>
          )}

          <button
            onClick={() => setVisible(false)}
            className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Masquer le bandeau"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* MODAL : NOUVEAU FLASH INFO */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-gray-850 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col text-gray-900 dark:text-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
                    <Radio size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight text-white">Diffuser un Flash Info</h3>
                    <p className="text-[11px] text-indigo-300">
                      Visible uniquement par l'établissement ciblé et le Super Admin.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl cursor-pointer transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="p-6 space-y-4">
                {/* Text Message */}
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-1.5">
                    Texte du Message Flash <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Ex: Réunion d'information parents-professeurs vendredi à 17h au réfectoire..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs outline-none focus:border-indigo-500 text-gray-900 dark:text-white resize-none"
                  />
                </div>

                {/* Type & Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-1.5">
                      Catégorie d'Alerte
                    </label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 outline-none"
                    >
                      <option value="flash">⚡ Flash Info Rapide</option>
                      <option value="urgent">⚠️ Urgent / Alerte</option>
                      <option value="info">📢 Avis Officiel</option>
                      <option value="event">🎉 Événement / Cérémonie</option>
                    </select>
                  </div>

                  {/* Target Establishment */}
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-1.5">
                      Établissement Cible
                    </label>
                    {isSuperAdmin ? (
                      <select
                        value={targetEstId}
                        onChange={(e) => setTargetEstId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 outline-none"
                      >
                        <option value="ALL">🌐 Tous les Établissements</option>
                        {establishments.map(est => (
                          <option key={est.id} value={est.id}>{est.nom} ({est.code})</option>
                        ))}
                      </select>
                    ) : (
                      <div className="px-3 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <Building2 size={14} className="text-indigo-500" />
                        <span className="truncate">{currentEstablishment?.nom || 'Votre Établissement'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-[11px] text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                  <ShieldCheck size={16} className="shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                  <span>
                    <strong>Isolation garantie :</strong> Ce message sera diffusé en temps réel uniquement aux élèves, parents, enseignants et personnels de l'établissement choisi. Les autres écoles n'y auront pas accès.
                  </span>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newText.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-500/20"
                  >
                    {isSubmitting ? 'Publication...' : 'Diffuser Immédiatement'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL : GESTION DES FLASH INFO ACTIFS */}
      <AnimatePresence>
        {showManageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManageModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-gray-850 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col text-gray-900 dark:text-white max-h-[85vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-gray-800">
                <div className="flex items-center gap-2.5">
                  <Megaphone size={20} className="text-amber-400" />
                  <div>
                    <h3 className="text-base font-black text-white">Annonces & Flash Info Actifs</h3>
                    <p className="text-[11px] text-gray-400">
                      Gérez ou retirez les annonces actuellement affichées dans le bandeau.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManageModal(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl cursor-pointer transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar flex-1">
                {flashItems.filter(f => f.source === 'announcement').length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    Aucune annonce manuelle active dans le bandeau.
                  </div>
                ) : (
                  flashItems.filter(f => f.source === 'announcement').map(item => (
                    <div
                      key={item.id}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded uppercase">
                            {item.type || 'Flash'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">
                            {item.etablissementNom}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2">
                          {item.text}
                        </p>
                        <span className="text-[10px] text-gray-500 block mt-1">
                          Par {item.authorName || 'Direction'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteAnnouncement(item)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl transition-colors cursor-pointer shrink-0"
                        title="Retirer du bandeau"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowManageModal(false)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 24s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />
    </div>
  );
}
