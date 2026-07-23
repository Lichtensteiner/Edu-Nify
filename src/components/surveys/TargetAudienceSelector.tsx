import React, { useState } from 'react';
import { Users, CheckSquare, Square, School, GraduationCap, UserCheck, Shield } from 'lucide-react';
import { TargetAudience } from '../../types/surveyElection';

interface TargetAudienceSelectorProps {
  value: TargetAudience;
  onChange: (value: TargetAudience) => void;
  userSchoolId?: string;
}

const DEFAULT_LEVELS = ['6ème', '5ème', '4ème', '3ème', 'Seconde', 'Première', 'Terminale'];

const DEFAULT_CLASSES = [
  '6ème A', '6ème B', '6ème C',
  '5ème A', '5ème B', '5ème C',
  '4ème A', '4ème B', '4ème C',
  '3ème A', '3ème B', '3ème C',
  '2nde 1', '2nde 2',
  '1ère S', '1ère L',
  'Tle S', 'Tle L'
];

export const TargetAudienceSelector: React.FC<TargetAudienceSelectorProps> = ({
  value,
  onChange,
  userSchoolId = 'all'
}) => {
  const scope = value.scope || 'all';
  const selectedRoles = value.roles || [];
  const selectedLevels = value.levels || [];
  const selectedClasses = value.classes || [];
  const selectedUsers = value.users || value.userIds || [];

  const handleScopeChange = (newScope: TargetAudience['scope']) => {
    let roles: string[] = [];
    if (newScope === 'teachers') roles = ['enseignant'];
    if (newScope === 'parents') roles = ['parent'];
    if (newScope === 'staff') roles = ['staff', 'personnel_administratif'];
    
    onChange({
      ...value,
      scope: newScope,
      schoolId: value.schoolId || userSchoolId,
      roles: newScope === 'custom' ? selectedRoles : roles,
      levels: newScope === 'levels' ? selectedLevels : [],
      classes: newScope === 'classes' ? selectedClasses : [],
      users: newScope === 'custom' ? selectedUsers : []
    });
  };

  const toggleLevel = (level: string) => {
    const updated = selectedLevels.includes(level)
      ? selectedLevels.filter(l => l !== level)
      : [...selectedLevels, level];
    
    onChange({
      ...value,
      scope: 'levels',
      levels: updated
    });
  };

  const toggleClass = (cls: string) => {
    const updated = selectedClasses.includes(cls)
      ? selectedClasses.filter(c => c !== cls)
      : [...selectedClasses, cls];
    
    onChange({
      ...value,
      scope: 'classes',
      classes: updated
    });
  };

  const toggleRole = (role: string) => {
    const updated = selectedRoles.includes(role)
      ? selectedRoles.filter(r => r !== role)
      : [...selectedRoles, role];
    
    onChange({
      ...value,
      roles: updated
    });
  };

  return (
    <div className="space-y-4 bg-gray-50 dark:bg-gray-900/60 p-5 rounded-3xl border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Users size={16} className="text-indigo-600" /> Public Cible (Destinataires)
        </h3>
        <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-md">
          {scope === 'all' && 'Toute l\'école'}
          {scope === 'levels' && `${selectedLevels.length} Niveau(x) sélectionné(s)`}
          {scope === 'classes' && `${selectedClasses.length} Classe(s) sélectionnée(s)`}
          {scope === 'teachers' && 'Enseignants uniquement'}
          {scope === 'parents' && 'Parents uniquement'}
          {scope === 'staff' && 'Personnel Administratif'}
          {scope === 'custom' && 'Sélection Personnalisée'}
        </span>
      </div>

      {/* Scope Radio Choices */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { id: 'all', label: 'Toute l\'école', icon: School },
          { id: 'levels', label: 'Par Niveau', icon: GraduationCap },
          { id: 'classes', label: 'Par Classe(s)', icon: Users },
          { id: 'teachers', label: 'Tous Enseignants', icon: UserCheck },
          { id: 'parents', label: 'Tous Parents', icon: Users },
          { id: 'staff', label: 'Personnel Admin', icon: Shield },
          { id: 'custom', label: 'Personnalisé', icon: CheckSquare }
        ].map((opt) => {
          const Icon = opt.icon;
          const isSelected = scope === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleScopeChange(opt.id as any)}
              className={`p-3 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300'
              }`}
            >
              <Icon size={16} className="shrink-0" />
              <span className="text-xs font-bold truncate">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Levels Selection Sub-Panel */}
      {scope === 'levels' && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 animate-in fade-in duration-200">
          <label className="text-[11px] font-extrabold text-gray-600 dark:text-gray-400 block">
            Cochez le ou les niveaux concernés :
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DEFAULT_LEVELS.map(level => {
              const checked = selectedLevels.includes(level);
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleLevel(level)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                    checked
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <span>{level}</span>
                  {checked ? <CheckSquare size={14} className="text-indigo-600" /> : <Square size={14} className="text-gray-300" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Classes Selection Sub-Panel */}
      {scope === 'classes' && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 animate-in fade-in duration-200">
          <label className="text-[11px] font-extrabold text-gray-600 dark:text-gray-400 block">
            Sélectionnez une ou plusieurs classes destinataires :
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
            {DEFAULT_CLASSES.map(cls => {
              const checked = selectedClasses.includes(cls);
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => toggleClass(cls)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                    checked
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <span>□ {cls}</span>
                  {checked ? <CheckSquare size={14} className="text-indigo-600" /> : <Square size={14} className="text-gray-300" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Roles Selection Sub-Panel */}
      {scope === 'custom' && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 animate-in fade-in duration-200">
          <label className="text-[11px] font-extrabold text-gray-600 dark:text-gray-400 block">
            Rôles cibles personnalisés :
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'eleve', label: 'Élèves' },
              { id: 'enseignant', label: 'Enseignants' },
              { id: 'parent', label: 'Parents' },
              { id: 'staff', label: 'Personnel Admin' },
              { id: 'directeur', label: 'Direction' }
            ].map(r => {
              const checked = selectedRoles.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRole(r.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                    checked
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <span>{r.label}</span>
                  {checked ? <CheckSquare size={14} className="text-indigo-600" /> : <Square size={14} className="text-gray-300" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
