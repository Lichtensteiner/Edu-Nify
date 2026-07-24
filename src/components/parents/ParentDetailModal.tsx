import React, { useState } from 'react';
import { 
  X, 
  User, 
  GraduationCap, 
  TrendingUp, 
  CreditCard, 
  FileText, 
  MessageSquare, 
  Vote, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Send,
  Calendar,
  Award
} from 'lucide-react';
import { Parent } from '../../types/parent';
import { generateParentProfilePDF } from '../../utils/parentPdfExport';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  parent: Parent | null;
  establishment: any;
  surveys?: any[];
  elections?: any[];
  onSendMessage?: (parentId: string, content: string) => Promise<void>;
  onOpenStudentDetail?: (studentId: string) => void;
}

export const ParentDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  parent,
  establishment,
  surveys = [],
  elections = [],
  onSendMessage,
  onOpenStudentDetail
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'children' | 'academic' | 'payments' | 'documents' | 'messaging' | 'surveys'>('profile');
  const [messageText, setMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  if (!isOpen || !parent) return null;

  const children = parent.children || [];
  const hasChildren = children.length > 0;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !onSendMessage) return;
    try {
      setSendingMsg(true);
      await onSendMessage(parent.id, messageText);
      setMessageText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMsg(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 my-6">
        
        {/* Profile Header Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white p-6 relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-2xl border-4 border-white/20 bg-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
              {parent.photo ? (
                <img src={parent.photo} alt={parent.nom} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold">{parent.nom.toUpperCase()} {parent.prenom}</h2>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                  parent.statut === 'actif' ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30' : 'bg-amber-400/20 text-amber-200'
                }`}>
                  {parent.statut?.toUpperCase() || 'ACTIF'}
                </span>
              </div>

              <p className="text-xs text-indigo-100 flex items-center justify-center sm:justify-start gap-2">
                <span>{parent.profession || 'Responsable Légal'}</span> • <span>{parent.ville || 'Libreville'}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-indigo-100">
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {parent.telephone}</span>
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {parent.email}</span>
                <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> {children.length} enfant(s) rattaché(s)</span>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() => generateParentProfilePDF(parent, establishment)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 flex items-center gap-1.5 transition-all"
              >
                <Download className="w-4 h-4" /> Fiche PDF
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-6 border-b border-white/10 overflow-x-auto scrollbar-none pt-2">
            {[
              { id: 'profile', label: 'Profil', icon: User },
              { id: 'children', label: `Enfants (${children.length})`, icon: GraduationCap },
              { id: 'academic', label: 'Suivi Scolaire', icon: TrendingUp },
              { id: 'payments', label: 'Paiements', icon: CreditCard },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'messaging', label: 'Messagerie', icon: MessageSquare },
              { id: 'surveys', label: 'Sondages & Élections', icon: Vote },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-indigo-100 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" /> Identité & Informations Personnelles
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Nom Complet</span>
                    <span className="font-bold text-gray-900">{parent.nom.toUpperCase()} {parent.prenom}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Sexe</span>
                    <span className="font-semibold text-gray-800">{parent.sexe === 'M' ? 'Masculin (M)' : parent.sexe === 'F' ? 'Féminin (F)' : parent.sexe || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Date de Naissance</span>
                    <span className="font-semibold text-gray-800">{parent.dateNaissance || 'Non renseignée'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Nationalité</span>
                    <span className="font-semibold text-gray-800">{parent.nationalite || 'Gabonaise'}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500 font-medium">Profession</span>
                    <span className="font-semibold text-gray-800">{parent.profession || 'Non renseignée'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" /> Coordonnées & Domicile
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Téléphone Principal</span>
                    <span className="font-bold text-indigo-600">{parent.telephone}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Téléphone Secondaire</span>
                    <span className="font-semibold text-gray-800">{parent.telephoneSecondaire || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Email</span>
                    <span className="font-semibold text-gray-800">{parent.email}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Ville / Quartier</span>
                    <span className="font-semibold text-gray-800">{parent.ville || 'Libreville'} {parent.quartier ? `(${parent.quartier})` : ''}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500 font-medium">Adresse Physique</span>
                    <span className="font-semibold text-gray-800">{parent.adresse || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHILDREN */}
          {activeTab === 'children' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Liste des Enfants Associés ({children.length})
              </h4>

              {children.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {children.map((c: any) => (
                    <div key={c.id || c.studentId} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-base">
                          {c.prenom?.[0] || 'E'}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-gray-900">{c.nom} {c.prenom}</h5>
                          <p className="text-[11px] text-gray-500">Matricule: {c.matricule || 'N/A'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded-md">
                              {c.classe || 'Non assigné'}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Lien: <strong>{c.relationship || 'Tuteur'}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {onOpenStudentDetail && (
                        <button
                          onClick={() => onOpenStudentDetail(c.id || c.studentId)}
                          className="px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 text-xs font-semibold rounded-xl border border-gray-200 transition-colors"
                        >
                          Voir Élève
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl">
                  Aucun enfant encore associé à ce compte.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACADEMIC FOLLOW-UP */}
          {activeTab === 'academic' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Aperçu du Suivi Scolaire des Enfants
              </h4>

              {hasChildren ? (
                <div className="space-y-4">
                  {children.map((c: any) => (
                    <div key={c.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900">{c.nom} {c.prenom} ({c.classe})</span>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                          Moyenne: 14.5 / 20
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                          <span className="text-gray-400 block text-[10px]">Absences</span>
                          <span className="font-bold text-gray-800">2 heures</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                          <span className="text-gray-400 block text-[10px]">Retards</span>
                          <span className="font-bold text-gray-800">1 fois</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                          <span className="text-gray-400 block text-[10px]">Discipline</span>
                          <span className="font-bold text-emerald-600">Excellente</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Aucune donnée disponible (aucun enfant associé).</p>
              )}
            </div>
          )}

          {/* TAB 4: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-emerald-800">Statut Financier Général</h5>
                  <p className="text-xs text-emerald-600">Scolarité à jour pour l'année en cours</p>
                </div>
                <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm">
                  À JOUR
                </span>
              </div>

              <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                <div className="p-3 bg-gray-50 text-xs font-bold text-gray-500 grid grid-cols-4">
                  <span>Libellé / Frais</span>
                  <span>Montant</span>
                  <span>Date</span>
                  <span>Statut</span>
                </div>
                <div className="p-3 text-xs grid grid-cols-4 items-center">
                  <span className="font-medium text-gray-800">Frais d'inscription 1er Trimestre</span>
                  <span className="font-bold text-gray-900">150 000 FCFA</span>
                  <span className="text-gray-500">12/09/2025</span>
                  <span className="text-emerald-600 font-semibold">Payé</span>
                </div>
                <div className="p-3 text-xs grid grid-cols-4 items-center">
                  <span className="font-medium text-gray-800">Frais de Scolarité 2ème Trimestre</span>
                  <span className="font-bold text-gray-900">120 000 FCFA</span>
                  <span className="text-gray-500">05/12/2025</span>
                  <span className="text-emerald-600 font-semibold">Payé</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-indigo-600" />
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Bulletin 1er Trimestre</h5>
                    <p className="text-[10px] text-gray-500">PDF officiel imprimable</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-white text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-xl text-xs font-semibold">
                  Télécharger
                </button>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-indigo-600" />
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Certificat de Scolarité</h5>
                    <p className="text-[10px] text-gray-500">Validé par la direction</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-white text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-xl text-xs font-semibold">
                  Télécharger
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: MESSAGING */}
          {activeTab === 'messaging' && (
            <div className="space-y-4">
              <form onSubmit={handleSendMessage} className="space-y-3">
                <textarea
                  rows={3}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Envoyer un message direct au parent..."
                  className="w-full p-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="text-right">
                  <button
                    type="submit"
                    disabled={sendingMsg || !messageText.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                  >
                    <Send className="w-3.5 h-3.5" /> Envoyer
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 7: SURVEYS & ELECTIONS WITH STRICT RULE CHECK */}
          {activeTab === 'surveys' && (
            <div className="space-y-4">
              {/* Mandatory child linkage check banner */}
              {!hasChildren && (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-2xl text-xs font-semibold flex items-center gap-3 shadow-sm">
                  <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold text-amber-950 text-sm">Avertissement d'éligibilité aux votes :</p>
                    <p className="mt-0.5">
                      "Vous ne pouvez pas participer à cette élection car aucun élève n'est associé à votre compte."
                    </p>
                  </div>
                </div>
              )}

              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Sondages & Élections Actifs Destinés aux Parents
              </h4>

              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-md uppercase">Élection</span>
                    <h5 className="text-xs font-bold text-gray-900 mt-1">Élection des Représentants des Parents d'Élèves</h5>
                    <p className="text-[11px] text-gray-500">Clôture des votes le 15 Février 2026</p>
                  </div>

                  <button
                    disabled={!hasChildren}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                      hasChildren
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {hasChildren ? 'Voter Maintenant' : 'Vote Inaccessible'}
                  </button>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-md uppercase">Sondage</span>
                    <h5 className="text-xs font-bold text-gray-900 mt-1">Sondage sur les Menus de la Restauration Scolaire</h5>
                    <p className="text-[11px] text-gray-500">Avis sur la qualité des repas du midi</p>
                  </div>

                  <button
                    disabled={!hasChildren}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                      hasChildren
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {hasChildren ? 'Répondre au Sondage' : 'Réponse Inaccessible'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-colors"
          >
            Fermer le Profil
          </button>
        </div>
      </div>
    </div>
  );
};
