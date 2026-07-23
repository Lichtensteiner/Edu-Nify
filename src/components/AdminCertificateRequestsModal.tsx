import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  ShieldCheck, 
  X, 
  Users, 
  Send,
  Download,
  Filter,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { 
  CertificateRequest, 
  subscribeToAllCertificateRequests, 
  approveCertificateRequest, 
  rejectCertificateRequest 
} from '../services/certificateService';

interface AdminCertificateRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminCertificateRequestsModal: React.FC<AdminCertificateRequestsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser } = useAuth();
  const { notifySuccess, notifyError } = useNotification();
  const { currentEstablishment } = useEstablishment();

  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const schoolId = currentEstablishment?.id || 'all';
    const unsub = subscribeToAllCertificateRequests(schoolId, (list) => {
      setRequests(list);
      setLoading(false);
    });

    return () => unsub();
  }, [isOpen, currentEstablishment?.id]);

  if (!isOpen) return null;

  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const handleApprove = async (req: CertificateRequest) => {
    setProcessingId(req.id);
    try {
      await approveCertificateRequest(req.id, req.studentId, req.studentName, currentUser);
      notifySuccess(`Le certificat de ${req.studentName} a été validé et rendu immédiatement disponible au téléchargement !`);
    } catch (err) {
      console.error("Error approving certificate:", err);
      notifyError("Erreur lors de la validation du certificat.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingId) return;

    const req = requests.find(r => r.id === rejectingId);
    if (!req) return;

    setProcessingId(rejectingId);
    try {
      await rejectCertificateRequest(rejectingId, req.studentId, rejectReason, currentUser);
      notifySuccess(`La demande de ${req.studentName} a été refusée.`);
      setRejectingId(null);
      setRejectReason('');
    } catch (err) {
      console.error("Error rejecting certificate:", err);
      notifyError("Erreur lors du refus de la demande.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                <FileText size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                    Gestion Administrative
                  </span>
                  {pendingCount > 0 && (
                    <span className="text-[10px] font-black bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full animate-bounce">
                      {pendingCount} en attente
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  Validation des Certificats de Scolarité
                </h2>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Filter Bar */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher par élève, classe ou motif..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none"
              >
                <option value="pending">En attente ({pendingCount})</option>
                <option value="approved">Validés / Disponibles</option>
                <option value="rejected">Refusés</option>
                <option value="all">Toutes les demandes</option>
              </select>
            </div>
          </div>

          {/* Requests Table */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="py-12 text-center text-gray-400 font-semibold animate-pulse">
                Chargement des demandes de certificats...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <FileText size={36} className="mx-auto opacity-30" />
                <p className="font-semibold text-sm">Aucune demande trouvée dans cette catégorie.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((req) => (
                  <div 
                    key={req.id}
                    className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-200 dark:hover:border-blue-900 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900 dark:text-white uppercase">
                          {req.studentName}
                        </span>
                        <span className="text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-0.5 rounded-md">
                          {req.className}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status === 'approved' ? 'Validé' : req.status === 'rejected' ? 'Refusé' : 'En attente'}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500">
                        Motif : <strong className="text-gray-700 dark:text-gray-300">{req.reason}</strong> • Demandé le {
                          req.requestDate?.toDate 
                            ? req.requestDate.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'Aujourd\'hui'
                        }
                      </p>

                      {req.certificateRef && (
                        <p className="text-[11px] font-mono text-emerald-600 font-bold">
                          Code Réf : {req.certificateRef} (Délivré par {req.approvedBy || 'Direction'})
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleApprove(req)}
                            disabled={processingId === req.id}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md"
                          >
                            <CheckCircle2 size={16} /> Valider & Rendre Disponible
                          </button>
                          <button
                            onClick={() => setRejectingId(req.id)}
                            disabled={processingId === req.id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition-all"
                          >
                            <XCircle size={16} /> Refuser
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-gray-400 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700">
                          {req.status === 'approved' ? 'Disponible pour l\'élève' : 'Demande refusée'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500">
            <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
              <ShieldCheck size={16} /> Système de délivrance sécurisé Edu-Nify
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 dark:bg-gray-700 font-bold text-gray-800 dark:text-gray-200 rounded-xl"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-sm w-full space-y-4 border border-gray-100 dark:border-gray-700 shadow-2xl">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              Motif du refus de certificat
            </h3>
            <form onSubmit={handleReject} className="space-y-4">
              <textarea 
                required
                rows={3}
                placeholder="Renseignez le motif (ex: Dossier incomplet, frais non réglés...)"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingId(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-500 bg-gray-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 text-white text-xs font-black rounded-xl"
                >
                  Confirmer le refus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
