import React from 'react';
import { X, Image as ImageIcon, Video, FileText, Loader2 } from 'lucide-react';
import { formatFileSize } from './DocumentViewer';

export interface SelectedFileItem {
  file: File;
  previewUrl: string;
  type: 'image' | 'video' | 'document';
}

interface MediaPreviewProps {
  items: SelectedFileItem[];
  onRemove: (index: number) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  items,
  onRemove,
  isUploading = false,
  uploadProgress = 0
}) => {
  if (items.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        <span>Fichiers sélectionnés ({items.length})</span>
        {isUploading && (
          <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium normal-case">
            <Loader2 size={14} className="animate-spin" />
            Envoi en cours ({uploadProgress}%)
          </span>
        )}
      </div>

      {isUploading && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item, index) => (
          <div
            key={`${item.file.name}-${index}`}
            className="relative group bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden p-2 flex items-center gap-3"
          >
            {item.type === 'image' && (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0">
                <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}

            {item.type === 'video' && (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-black shrink-0 relative flex items-center justify-center">
                <video src={item.previewUrl} className="w-full h-full object-cover" />
                <Video className="absolute text-white/80" size={20} />
              </div>
            )}

            {item.type === 'document' && (
              <div className="w-16 h-16 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
                <FileText size={28} />
              </div>
            )}

            <div className="min-w-0 flex-1 pr-6">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate" title={item.file.name}>
                {item.file.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded uppercase">
                  {item.type}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  {formatFileSize(item.file.size)}
                </span>
              </div>
            </div>

            {!isUploading && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-full transition-colors"
                title="Supprimer ce fichier"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
