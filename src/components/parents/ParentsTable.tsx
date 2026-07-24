import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Link as LinkIcon, 
  Send, 
  KeyRound, 
  UserX, 
  UserCheck, 
  FileText, 
  Trash2, 
  Download, 
  Phone, 
  Mail, 
  User, 
  PlusCircle, 
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { Parent } from '../../types/parent';
import { generateParentProfilePDF, exportParentsExcelCSV } from '../../utils/parentPdfExport';

interface Props {
  parents: Parent[];
  establishment: any;
  onView: (parent: Parent) => void;
  onEdit: (parent: Parent) => void;
  onAssociate: (parent: Parent) => void;
  onSendMessage: (parent: Parent) => void;
  onResetPassword: (parent: Parent) => void;
  onToggleStatus: (parent: Parent) => void;
  onSoftDelete: (parent: Parent) => void;
  onOpenAddModal: () => void;
  isTrashView?: boolean;
  onRestore?: (parent: Parent) => void;
}

export const ParentsTable: React.FC<Props> = ({
  parents,
  establishment,
  onView,
  onEdit,
  onAssociate,
  onSendMessage,
  onResetPassword,
  onToggleStatus,
  onSoftDelete,
  onOpenAddModal,
  isTrashView = false,
  onRestore
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'actif' | 'inactif'>('all');
  const [classFilter, setClassFilter] = useState('all');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Extract all unique classes
  const allClasses = Array.from(new Set(parents.flatMap(p => p.classes || []).filter(Boolean)));

  // Filter parents
  const filteredParents = parents.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      !term ||
      p.nom.toLowerCase().includes(term) ||
      p.prenom.toLowerCase().includes(term) ||
      p.telephone.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      (p.profession && p.profession.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'all' || p.statut === statusFilter;
    const matchesClass = classFilter === 'all' || (p.classes && p.classes.includes(classFilter));

    return matchesSearch && matchesStatus && matchesClass;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Table Toolbar Header */}
      <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-gray-50/50">
        
        {/* Left: Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone, email, profession..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 shadow-sm"
          >
            <option value="all">Tous les Statuts</option>
            <option value="actif">Comptes Actifs</option>
            <option value="inactif">Comptes Inactifs</option>
          </select>

          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 shadow-sm"
          >
            <option value="all">Toutes les Classes</option>
            {allClasses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Right: Export & Add Actions */}
        <div className="flex items-center gap-2">
          {/* Excel export */}
          <button
            onClick={() => exportParentsExcelCSV(filteredParents, 'excel')}
            title="Exporter en Excel"
            className="p-2.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-gray-200 rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>

          {/* CSV Export */}
          <button
            onClick={() => exportParentsExcelCSV(filteredParents, 'csv')}
            title="Exporter en CSV"
            className="p-2.5 bg-white hover:bg-blue-50 text-blue-700 border border-gray-200 rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> CSV
          </button>

          {/* Add Parent Button */}
          {!isTrashView && (
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-2 transition-all"
            >
              <PlusCircle className="w-4 h-4" /> Nouveau Parent
            </button>
          )}
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
              <th className="py-3.5 px-4">Parent / Responsable</th>
              <th className="py-3.5 px-4">Contacts</th>
              <th className="py-3.5 px-4">Profession</th>
              <th className="py-3.5 px-4 text-center">Enfants</th>
              <th className="py-3.5 px-4">Classes Associées</th>
              <th className="py-3.5 px-4">Statut</th>
              <th className="py-3.5 px-4">Dernière Connexion</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-xs">
            {filteredParents.length > 0 ? (
              filteredParents.map((parent) => {
                const childCount = parent.children?.length || parent.childrenIds?.length || 0;
                const isDropdownOpen = activeDropdownId === parent.id;

                return (
                  <tr key={parent.id} className="hover:bg-indigo-50/30 transition-colors group">
                    {/* Photo + Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-100 bg-indigo-50 flex items-center justify-center shrink-0">
                          {parent.photo ? (
                            <img src={parent.photo} alt={parent.nom} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-indigo-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {parent.nom.toUpperCase()} {parent.prenom}
                          </p>
                          <span className="text-[10px] text-gray-400 font-medium">
                            ID: {parent.id.slice(0, 8)} • {parent.sexe || 'M'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contacts */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-gray-800 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-indigo-500" /> {parent.telephone}
                        </p>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" /> {parent.email}
                        </p>
                      </div>
                    </td>

                    {/* Profession */}
                    <td className="py-3 px-4 font-medium text-gray-700">
                      {parent.profession || <span className="text-gray-400 italic">Non renseignée</span>}
                    </td>

                    {/* Children count badge */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        childCount > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {childCount} {childCount > 1 ? 'enfants' : 'enfant'}
                      </span>
                    </td>

                    {/* Associated Classes */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {parent.classes && parent.classes.length > 0 ? (
                          parent.classes.map(cls => (
                            <span key={cls} className="px-2 py-0.5 bg-gray-100 text-gray-700 font-semibold text-[10px] rounded-md">
                              {cls}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-[11px] italic">Aucune classe</span>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        parent.statut === 'actif'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${parent.statut === 'actif' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {parent.statut?.toUpperCase() || 'ACTIF'}
                      </span>
                    </td>

                    {/* Last Login */}
                    <td className="py-3 px-4 text-gray-500 text-[11px]">
                      {parent.lastLogin ? new Date(parent.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'}
                    </td>

                    {/* Actions dropdown */}
                    <td className="py-3 px-4 text-right relative">
                      {isTrashView ? (
                        <button
                          onClick={() => onRestore && onRestore(parent)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl flex items-center gap-1 ml-auto"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Restaurer
                        </button>
                      ) : (
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setActiveDropdownId(isDropdownOpen ? null : parent.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isDropdownOpen && (
                            <div 
                              className="absolute right-0 mt-1 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-30 text-xs divide-y divide-gray-50"
                              onMouseLeave={() => setActiveDropdownId(null)}
                            >
                              <div className="py-1">
                                <button
                                  onClick={() => { onView(parent); setActiveDropdownId(null); }}
                                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-gray-700 font-medium flex items-center gap-2"
                                >
                                  <Eye className="w-3.5 h-3.5 text-indigo-600" /> Voir Profil Complet
                                </button>

                                <button
                                  onClick={() => { onEdit(parent); setActiveDropdownId(null); }}
                                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-gray-700 font-medium flex items-center gap-2"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-amber-600" /> Modifier Informations
                                </button>

                                <button
                                  onClick={() => { onAssociate(parent); setActiveDropdownId(null); }}
                                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-gray-700 font-medium flex items-center gap-2"
                                >
                                  <LinkIcon className="w-3.5 h-3.5 text-purple-600" /> Associer Élève(s)
                                </button>
                              </div>

                              <div className="py-1">
                                <button
                                  onClick={() => { onSendMessage(parent); setActiveDropdownId(null); }}
                                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-gray-700 font-medium flex items-center gap-2"
                                >
                                  <Send className="w-3.5 h-3.5 text-blue-600" /> Envoyer Message / Notif
                                </button>

                                <button
                                  onClick={() => { onResetPassword(parent); setActiveDropdownId(null); }}
                                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-gray-700 font-medium flex items-center gap-2"
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-orange-600" /> Réinitialiser Mot de passe
                                </button>

                                <button
                                  onClick={() => { onToggleStatus(parent); setActiveDropdownId(null); }}
                                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-gray-700 font-medium flex items-center gap-2"
                                >
                                  {parent.statut === 'actif' ? (
                                    <>
                                      <UserX className="w-3.5 h-3.5 text-rose-600" /> Désactiver le Compte
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Activer le Compte
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => { generateParentProfilePDF(parent, establishment); setActiveDropdownId(null); }}
                                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-gray-700 font-medium flex items-center gap-2"
                                >
                                  <FileText className="w-3.5 h-3.5 text-emerald-600" /> Télécharger Fiche PDF
                                </button>
                              </div>

                              <div className="py-1">
                                <button
                                  onClick={() => { onSoftDelete(parent); setActiveDropdownId(null); }}
                                  className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Déplacer dans Corbeille
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                  Aucun parent correspondant au filtre sélectionné.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Count */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Affichage de <strong>{filteredParents.length}</strong> sur <strong>{parents.length}</strong> parents enregistrés</span>
      </div>
    </div>
  );
};
