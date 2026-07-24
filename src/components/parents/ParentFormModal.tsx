import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Briefcase, Lock, ShieldCheck, Camera, Check } from 'lucide-react';
import { Parent } from '../../types/parent';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (parentData: Partial<Parent>, isNew: boolean) => Promise<void>;
  initialData?: Parent | null;
}

export const ParentFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [formData, setFormData] = useState<Partial<Parent>>({
    nom: '',
    prenom: '',
    sexe: 'M',
    dateNaissance: '',
    nationalite: 'Gabonaise',
    profession: '',
    telephone: '',
    telephoneSecondaire: '',
    email: '',
    adresse: '',
    ville: 'Libreville',
    quartier: '',
    photo: '',
    statut: 'actif',
  });

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nom: initialData.nom || '',
        prenom: initialData.prenom || '',
        sexe: initialData.sexe || 'M',
        dateNaissance: initialData.dateNaissance || '',
        nationalite: initialData.nationalite || 'Gabonaise',
        profession: initialData.profession || '',
        telephone: initialData.telephone || '',
        telephoneSecondaire: initialData.telephoneSecondaire || '',
        email: initialData.email || '',
        adresse: initialData.adresse || '',
        ville: initialData.ville || 'Libreville',
        quartier: initialData.quartier || '',
        photo: initialData.photo || '',
        statut: initialData.statut || 'actif',
      });
      setPassword('');
    } else {
      setFormData({
        nom: '',
        prenom: '',
        sexe: 'M',
        dateNaissance: '',
        nationalite: 'Gabonaise',
        profession: '',
        telephone: '',
        telephoneSecondaire: '',
        email: '',
        adresse: '',
        ville: 'Libreville',
        quartier: '',
        photo: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
        statut: 'actif',
      });
      setPassword('Parent123!');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom || !formData.prenom || !formData.telephone || !formData.email) {
      setError('Veuillez remplir au moins le nom, prénom, téléphone et adresse e-mail.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(
        {
          ...formData,
          ...(password ? { password } as any : {})
        },
        !initialData
      );
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement du parent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {initialData ? 'Modifier la Fiche Parent' : 'Ajouter un Nouveau Parent / Tuteur'}
              </h3>
              <p className="text-xs text-indigo-100">Renseignez l'ensemble des informations d'identification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Avatar and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Photo Avatar input */}
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-indigo-100 mb-3 flex items-center justify-center">
                {formData.photo ? (
                  <img src={formData.photo} alt="Parent" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-indigo-400" />
                )}
              </div>
              <label className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                <Camera className="w-3.5 h-3.5" /> Changer photo
                <input
                  type="text"
                  placeholder="URL photo"
                  className="hidden"
                  onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                />
              </label>
              <input
                type="text"
                value={formData.photo || ''}
                onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                placeholder="https://..."
                className="mt-3 text-xs w-full px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Names & Gender */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.nom || ''}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="ex: MBOUMBA"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.prenom || ''}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    placeholder="ex: Jean-Paul"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Genre / Sexe</label>
                  <select
                    value={formData.sexe || 'M'}
                    onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="M">Masculin (Homme)</option>
                    <option value="F">Féminin (Femme)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date de Naissance</label>
                  <input
                    type="date"
                    value={formData.dateNaissance || ''}
                    onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nationalité</label>
                  <input
                    type="text"
                    value={formData.nationalite || 'Gabonaise'}
                    onChange={(e) => setFormData({ ...formData, nationalite: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Contact & Professional Info */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-indigo-500" /> Contacts & Profession
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Téléphone Principal *</label>
                <input
                  type="text"
                  required
                  placeholder="+241 07 00 00 00"
                  value={formData.telephone || ''}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Téléphone Secondaire</label>
                <input
                  type="text"
                  placeholder="+241 06 00 00 00"
                  value={formData.telephoneSecondaire || ''}
                  onChange={(e) => setFormData({ ...formData, telephoneSecondaire: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Adresse Email *</label>
                <input
                  type="email"
                  required
                  placeholder="parent@domaine.ga"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Profession / Fonction</label>
                <input
                  type="text"
                  placeholder="ex: Ingénieur Télécom, Enseignant, Avocat..."
                  value={formData.profession || ''}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Statut du Compte</label>
                <select
                  value={formData.statut || 'actif'}
                  onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-emerald-700"
                >
                  <option value="actif">Actif (Accès autorisé)</option>
                  <option value="inactif">Inactif (Accès restreint)</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Residence Address */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Adresse & Domicile
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={formData.ville || 'Libreville'}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Quartier / Zone</label>
                <input
                  type="text"
                  placeholder="ex: Akanda, Glass, Louis..."
                  value={formData.quartier || ''}
                  onChange={(e) => setFormData({ ...formData, quartier: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Adresse Complète</label>
                <input
                  type="text"
                  placeholder="Rue, Villa, BP..."
                  value={formData.adresse || ''}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>

          {!initialData && (
            <>
              <hr className="border-gray-100" />
              {/* Password for initial creation */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-500" /> Sécurité & Connexion
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mot de passe temporaire</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Définir le mot de passe initial"
                    className="w-full sm:w-1/2 px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Le parent devra personnaliser son mot de passe lors de sa première connexion.</p>
                </div>
              </div>
            </>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {initialData ? 'Enregistrer les Modifications' : 'Créer le Compte Parent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
