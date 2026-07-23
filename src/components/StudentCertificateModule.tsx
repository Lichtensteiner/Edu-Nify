import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  QrCode,
  ShieldCheck,
  Send,
  Building2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { 
  CertificateRequest, 
  requestCertificate, 
  subscribeToStudentCertificates 
} from '../services/certificateService';
import { getSystemHeaderInfo, drawMiniFlag } from '../pages/DocumentGenerator';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export function StudentCertificateModule() {
  const { currentUser } = useAuth();
  const { notifySuccess, notifyError } = useNotification();
  const { currentEstablishment } = useEstablishment();

  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [reason, setReason] = useState('Dossier Administratif');
  const [customReason, setCustomReason] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const studentId = currentUser.id || currentUser.uid;

    const unsub = subscribeToStudentCertificates(studentId, (list) => {
      setRequests(list);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSubmitting(true);
    try {
      const finalReason = reason === 'Autre' ? customReason : reason;
      const studentName = `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() || currentUser.email;

      await requestCertificate({
        studentId: currentUser.id || currentUser.uid,
        studentName,
        studentMatricule: currentUser.matricule || currentUser.id?.substring(0, 10),
        className: currentUser.classe || 'Élève',
        dateNaissance: currentUser.dateNaissance || '---',
        lieuNaissance: currentUser.lieuNaissance || '---',
        gender: currentUser.sexe || currentUser.gender || '---',
        schoolId: currentUser.etablissement || currentEstablishment?.id || 'all',
        reason: finalReason,
        academicYear: '2025-2026'
      });

      notifySuccess("Votre demande de certificat de scolarité a été soumise avec succès ! L'administration va l'examiner.");
      setShowModal(false);
      setReason('Dossier Administratif');
      setCustomReason('');
    } catch (err) {
      console.error("Error creating certificate request:", err);
      notifyError("Erreur lors de la soumission de la demande.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async (cert: CertificateRequest) => {
    setDownloadingId(cert.id);
    try {
      const doc = new jsPDF();
      const activeEst = currentEstablishment;

      // Color defaults
      const primaryRGB = [79, 70, 229]; // Indigo

      // Border & Watermark
      doc.setDrawColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
      doc.setLineWidth(1.2);
      doc.rect(8, 8, 194, 281);
      doc.setLineWidth(0.25);
      doc.rect(9.2, 9.2, 191.6, 278.6);

      // System Header
      const headerInfo = getSystemHeaderInfo(activeEst?.systemeScolaire, activeEst);
      const isGabon = headerInfo.pays.includes("GABON");
      const isFrance = headerInfo.pays.includes("FRAN");

      if (isGabon) {
        doc.setFillColor(76, 175, 80); doc.rect(0, 0, 70, 3, 'F');
        doc.setFillColor(255, 235, 59); doc.rect(70, 0, 70, 3, 'F');
        doc.setFillColor(33, 150, 243); doc.rect(140, 0, 70, 3, 'F');
      } else if (isFrance) {
        doc.setFillColor(33, 150, 243); doc.rect(0, 0, 70, 3, 'F');
        doc.setFillColor(255, 255, 255); doc.rect(70, 0, 70, 3, 'F');
        doc.setFillColor(244, 67, 54); doc.rect(140, 0, 70, 3, 'F');
      } else {
        doc.setFillColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
        doc.rect(0, 0, 210, 3, 'F');
      }

      drawMiniFlag(doc, headerInfo.codePays, 99, 6, 12, 6);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(headerInfo.pays, 105, 17, { align: 'center' });

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`« ${headerInfo.deviseNationale} »`, 105, 21.5, { align: 'center' });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(headerInfo.ministere, 105, 26, { align: 'center' });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(headerInfo.direction, 105, 30, { align: 'center' });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
      doc.text(headerInfo.nomEtablissement.toUpperCase(), 105, 35, { align: 'center' });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${headerInfo.adresseEtablissement} | ${headerInfo.contactEtablissement}`, 105, 40, { align: 'center' });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(15, 43, 195, 43);

      // Title
      doc.setFontSize(22);
      doc.setFont("times", "bold");
      doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
      doc.text("CERTIFICAT DE SCOLARITÉ", 105, 60, { align: 'center' });

      // Cert Reference
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text(`N° Réf : ${cert.certificateRef || 'CERT-2026-OFFICIEL'}`, 105, 67, { align: 'center' });

      // Body text
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.setLineHeightFactor(1.45);

      const bodyText = `Le Chef d'établissement soussigné de "${activeEst?.nom || 'notre institution'}", certifie par la présente que l'élève identifié(e) ci-dessous est régulièrement inscrit(e) au sein de notre établissement pour l'année académique en cours.`;

      const splitText = doc.splitTextToSize(bodyText, 160);
      doc.text(splitText, 25, 80);

      // Student details box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(25, 102, 160, 72, 3, 3, 'F');

      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
      doc.setFontSize(10);
      doc.text("IDENTIFICATION DE L'ÉLÈVE", 35, 112);

      doc.setFontSize(10);
      const rowY = 122;
      const spacing = 9;

      doc.setTextColor(100, 116, 139);
      doc.text(`NOM ET PRÉNOM :`, 35, rowY);
      doc.text(`MATRICULE :`, 35, rowY + spacing);
      doc.text(`NÉ(E) LE :`, 35, rowY + spacing * 2);
      doc.text(`CLASSE :`, 35, rowY + spacing * 3);
      doc.text(`MOTIF DE DÉLIVRANCE :`, 35, rowY + spacing * 4);

      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text(cert.studentName.toUpperCase(), 85, rowY);
      doc.setFont("helvetica", "normal");
      doc.text((cert.studentMatricule || 'N/A').toUpperCase(), 85, rowY + spacing);
      doc.text(cert.dateNaissance || 'N/A', 85, rowY + spacing * 2);
      doc.text((cert.className || 'N/A').toUpperCase(), 85, rowY + spacing * 3);
      doc.text(cert.reason || 'Dossier Administratif', 85, rowY + spacing * 4);

      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text(`Année Académique : ${cert.academicYear || "2025-2026"}`, 25, 188);

      const closingText = `En foi de quoi, ce certificat lui est délivré pour servir et valoir ce que de droit.`;
      doc.text(closingText, 25, 198);

      const approvedDate = cert.approvedAt?.toDate ? cert.approvedAt.toDate().toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text(`Délivré le ${approvedDate} par l'Administration.`, 25, 212);

      // Signatory
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
      doc.text("LE DIRECTEUR / L'ADMINISTRATION", 130, 225);

      // QR Code
      const qrData = `EDU_NIFY_CERT_VERIF|REF:${cert.certificateRef}|STUDENT:${cert.studentName}|CLASS:${cert.className}`;
      const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 1 });
      doc.addImage(qrDataUrl, 'PNG', 25, 230, 28, 28);

      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("Document numérique vérifié", 25, 262);
      doc.text(`Signé par : ${cert.approvedBy || 'Direction'}`, 130, 250);

      doc.save(`Certificat_Scolarité_${cert.studentName.replace(/\s+/g, '_')}.pdf`);
      notifySuccess("Certificat de scolarité téléchargé !");
    } catch (e) {
      console.error("Error generating student certificate:", e);
      notifyError("Erreur lors du téléchargement du certificat.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Certificats de Scolarité
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Demandez et téléchargez vos documents scolaires officiels en 1 clic
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md shrink-0"
        >
          <Plus size={16} /> Demander un Certificat
        </button>
      </div>

      {/* List of Requests */}
      {loading ? (
        <div className="py-12 flex justify-center text-gray-400 gap-2 items-center">
          <RefreshCw className="animate-spin text-indigo-600" size={20} />
          <span className="text-xs font-medium">Chargement de vos demandes...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="py-12 text-center text-gray-400 space-y-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-dashed border-gray-200 dark:border-gray-700">
          <FileText size={40} className="mx-auto text-gray-300" />
          <p className="font-bold text-sm text-gray-700 dark:text-gray-300">
            Aucune demande de certificat effectuée
          </p>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Cliquez sur "Demander un Certificat" pour formuler votre demande auprès de l'administration. Dès validation, le bouton de téléchargement apparaîtra ici.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
          >
            <Plus size={14} /> Effectuer ma 1ère demande
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div 
              key={req.id} 
              className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 ${
                req.status === 'approved' 
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                  : req.status === 'rejected'
                  ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                  : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    req.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                      : req.status === 'rejected'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                  }`}>
                    {req.status === 'approved' && ' Validé & Disponible'}
                    {req.status === 'rejected' && ' Non Validé'}
                    {req.status === 'pending' && ' En Attente de Validation'}
                  </span>

                  {req.certificateRef && (
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                      Réf : {req.certificateRef}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Certificat de Scolarité ({req.academicYear || '2025-2026'})
                </h4>

                <p className="text-xs text-gray-500">
                  Motif : <strong>{req.reason}</strong> • Demandé le {
                    req.requestDate?.toDate 
                      ? req.requestDate.toDate().toLocaleDateString('fr-FR')
                      : 'Récemment'
                  }
                </p>

                {req.status === 'rejected' && req.rejectionReason && (
                  <p className="text-xs font-semibold text-red-600 mt-1">
                    Motif du refus : {req.rejectionReason}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex items-center justify-end">
                {req.status === 'approved' ? (
                  <button
                    onClick={() => handleDownloadPDF(req)}
                    disabled={downloadingId === req.id}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl text-xs font-black shadow-lg transition-all transform hover:scale-105"
                  >
                    {downloadingId === req.id ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      <Download size={16} />
                    )}
                    <span>Télécharger le Certificat (PDF)</span>
                  </button>
                ) : req.status === 'pending' ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-900/40 px-3.5 py-2 rounded-xl">
                    <Clock size={16} className="animate-pulse text-amber-600" />
                    <span>En attente de signature</span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-3 py-1.5 rounded-xl">
                    Demande archivée
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal to Request Certificate */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-700 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FileText size={20} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">
                    Demande de Certificat de Scolarité
                  </h3>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1">
                    Élève concerné
                  </label>
                  <input 
                    type="text"
                    disabled
                    value={`${currentUser?.prenom || ''} ${currentUser?.nom || ''} (${currentUser?.classe || 'Élève'})`}
                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-300 border-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1">
                    Motif / Usage du document
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Dossier Administratif">Dossier Administratif Général</option>
                    <option value="Demande de Bourse">Demande de Bourse Scolaire</option>
                    <option value="Transport / Carte de Transport">Carte de Transport / Pass SNTMF</option>
                    <option value="Caisse d'Allocation / CNSS">Caisse d'Allocation Famille (CNSS/CAF)</option>
                    <option value="Titre de Séjour / Paspot">Visas / Passeport / Titre de séjour</option>
                    <option value="Autre">Autre motif spécifié</option>
                  </select>
                </div>

                {reason === 'Autre' && (
                  <div>
                    <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1">
                      Précisez votre motif
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Démarche consulaire..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl text-[11px] text-indigo-800 dark:text-indigo-300 leading-relaxed font-medium">
                  ℹ️ Une fois soumise, votre demande sera instantanément notifiée au secrétariat. Dès validation, vous pourrez télécharger directement votre certificat PDF officiel signé.
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-2xl"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                    <span>Soumettre ma demande</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
