import React, { useState } from 'react';
import { X, Search, Link as LinkIcon, Check, GraduationCap, UserCheck, Trash2 } from 'lucide-react';
import { Parent } from '../../types/parent';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  parent: Parent | null;
  students: any[];
  onAssociate: (parentId: string, studentIds: string[], relationship: string) => Promise<void>;
  onRemoveAssociation: (parentId: string, studentId: string) => Promise<void>;
}

export const ParentStudentAssociationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  parent,
  students,
  onAssociate,
  onRemoveAssociation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [relationship, setRelationship] = useState('Père');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !parent) return null;

  // Currently linked children
  const linkedChildren = parent.children || [];
  const linkedIds = new Set(linkedChildren.map((c: any) => c.id || c.studentId));

  // Extract unique classes
  const allClasses = Array.from(new Set(students.map(s => s.classe || s.class_name).filter(Boolean)));

  // Filter unlinked students for association selection
  const filteredStudents = students.filter(student => {
    if (linkedIds.has(student.id)) return false;

    const matchesClass = selectedClass === 'all' || (student.classe || student.class_name) === selectedClass;
    
    const term = searchTerm.toLowerCase();
    const name = `${student.nom || ''} ${student.prenom || ''}`.toLowerCase();
    const matricule = (student.matricule || '').toLowerCase();
    const classe = (student.classe || student.class_name || '').toLowerCase();

    const matchesSearch = !term || name.includes(term) || matricule.includes(term) || classe.includes(term);

    return matchesClass && matchesSearch;
  });

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSaveAssociation = async () => {
    if (selectedStudentIds.length === 0) {
      setError('Veuillez sélectionner au moins un élève à associer.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onAssociate(parent.id, selectedStudentIds, relationship);
      setSelectedStudentIds([]);
      setSearchTerm('');
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'association.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (studentId: string) => {
    try {
      setLoading(true);
      await onRemoveAssociation(parent.id, studentId);
    } catch (err: any) {
      setError(err.message || "Erreur lors du retrait de la liaison.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Associer des Élèves à {parent.nom} {parent.prenom}</h3>
              <p className="text-xs text-indigo-100">Définissez le lien de parenté et reliez un ou plusieurs enfants</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Currently Associated Children */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Enfants Déjà Rattachés ({linkedChildren.length})</span>
            </h4>

            {linkedChildren.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {linkedChildren.map((c: any) => (
                  <div key={c.id || c.studentId} className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        {c.prenom?.[0] || 'E'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{c.nom} {c.prenom}</p>
                        <p className="text-[11px] text-gray-500">
                          {c.classe || 'Sans classe'} • {c.relationship || 'Tuteur'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(c.id || c.studentId)}
                      disabled={loading}
                      title="Retirer la liaison"
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100/50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl">Aucun enfant encore associé à ce parent.</p>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* New Association Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Sélectionner de Nouveaux Élèves
            </h4>

            {/* Relationship Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Lien de Parenté</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-800"
                >
                  <option value="Père">Père</option>
                  <option value="Mère">Mère</option>
                  <option value="Tuteur légal">Tuteur légal</option>
                  <option value="Grand-parent">Grand-parent</option>
                  <option value="Oncle">Oncle</option>
                  <option value="Tante">Tante</option>
                  <option value="Autre responsable">Autre responsable</option>
                </select>
              </div>

              {/* Class Filter & Search input */}
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Filtrer Classe</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs"
                  >
                    <option value="all">Toutes les classes</option>
                    {allClasses.map((cl: any) => (
                      <option key={cl} value={cl}>{cl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Recherche</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Nom, matricule..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* List of candidates */}
            <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => {
                  const isChecked = selectedStudentIds.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStudentSelection(student.id)}
                      className={`flex items-center justify-between p-3 cursor-pointer hover:bg-indigo-50/40 transition-colors ${
                        isChecked ? 'bg-indigo-50/80' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{student.nom} {student.prenom}</p>
                          <p className="text-[11px] text-gray-500">
                            Matricule: {student.matricule || 'N/A'} • Classe: {student.classe || student.class_name || 'Non assigné'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {student.sexe || 'Élève'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-gray-400">
                  Aucun élève correspondant trouvé.
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-medium">
              {selectedStudentIds.length} élève(s) sélectionné(s)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50"
              >
                Fermer
              </button>

              <button
                type="button"
                onClick={handleSaveAssociation}
                disabled={loading || selectedStudentIds.length === 0}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 shadow-md shadow-indigo-200 flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5" />
                )}
                Confirmer l'Association ({selectedStudentIds.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
