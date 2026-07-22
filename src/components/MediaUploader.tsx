import React, { useRef } from 'react';
import { Camera, Video, Paperclip, Plus } from 'lucide-react';
import { validateFile, getFileType } from '../services/firebaseStorage';
import { SelectedFileItem } from './MediaPreview';

interface MediaUploaderProps {
  onFilesSelected: (newFiles: SelectedFileItem[]) => void;
  onError: (errorMessage: string) => void;
  disabled?: boolean;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  onFilesSelected,
  onError,
  disabled = false
}) => {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const validItems: SelectedFileItem[] = [];

    Array.from(fileList).forEach((file) => {
      const check = validateFile(file);
      if (!check.valid) {
        onError(check.error || 'Fichier invalide');
        return;
      }

      const type = getFileType(file.name);
      if (!type) return;

      const previewUrl = URL.createObjectURL(file);
      validItems.push({
        file,
        previewUrl,
        type
      });
    });

    if (validItems.length > 0) {
      onFilesSelected(validItems);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Photo button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => photoInputRef.current?.click()}
        className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Camera size={18} className="text-emerald-600 dark:text-emerald-400" />
        <span>Photo</span>
      </button>
      <input
        ref={photoInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={(e) => {
          processFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Video button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => videoInputRef.current?.click()}
        className="flex items-center gap-2 px-3.5 py-2 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Video size={18} className="text-purple-600 dark:text-purple-400" />
        <span>Vidéo</span>
      </button>
      <input
        ref={videoInputRef}
        type="file"
        multiple
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(e) => {
          processFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Document button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => docInputRef.current?.click()}
        className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Paperclip size={18} className="text-amber-600 dark:text-amber-400" />
        <span>Document</span>
      </button>
      <input
        ref={docInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        className="hidden"
        onChange={(e) => {
          processFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
};
