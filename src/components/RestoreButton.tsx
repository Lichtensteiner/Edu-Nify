import React from 'react';
import { RotateCcw } from 'lucide-react';

interface RestoreButtonProps {
  onRestore: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export const RestoreButton: React.FC<RestoreButtonProps> = ({
  onRestore,
  isLoading = false,
  disabled = false,
  label = 'Restaurer',
  className = ''
}) => {
  return (
    <button
      onClick={onRestore}
      disabled={disabled || isLoading}
      className={`px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${className}`}
    >
      <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
      <span>{label}</span>
    </button>
  );
};
