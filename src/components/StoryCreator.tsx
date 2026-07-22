import React, { useState } from 'react';
import { MediaUploader } from './MediaUploader';
import { MediaPreview, SelectedFileItem } from './MediaPreview';
import { uploadStoryMedia } from '../services/firebaseStorage';
import { createStory } from '../services/storyService';
import { notifyAllUsers } from '../services/NotificationService';
import { Send, Sparkles, Plus, Image, MessageSquarePlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StoryCreatorProps {
  currentUser: any;
  notifySuccess: (msg: string) => void;
  notifyError: (msg: string) => void;
}

export const StoryCreator: React.FC<StoryCreatorProps> = ({
  currentUser,
  notifySuccess,
  notifyError
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedFileItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const authorName = currentUser?.prenom || currentUser?.nom
    ? `${currentUser?.prenom || ''} ${currentUser?.nom || ''}`.trim()
    : currentUser?.email?.split('@')[0] || 'Utilisateur';

  const userRole = currentUser?.role || 'enseignant';

  const handleAddFiles = (newItems: SelectedFileItem[]) => {
    setSelectedItems((prev) => [...prev, ...newItems]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim() && selectedItems.length === 0) {
      notifyError('Veuillez ajouter du texte ou au moins un fichier.');
      return;
    }

    const userId = currentUser?.id || currentUser?.uid;
    if (!userId) {
      notifyError('Utilisateur non identifié.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(10);

    try {
      const mediaResults = [];
      const totalFiles = selectedItems.length;

      for (let i = 0; i < totalFiles; i++) {
        const item = selectedItems[i];
        const media = await uploadStoryMedia(
          item.file,
          currentUser?.etablissement || 'default_school',
          userId,
          (prog) => {
            const currentTotal = Math.round(((i + prog / 100) / totalFiles) * 80) + 10;
            setUploadProgress(currentTotal);
          }
        );
        mediaResults.push(media);
      }

      setUploadProgress(90);

      await createStory({
        authorId: userId,
        authorName,
        authorPhotoUrl: currentUser?.photo || null,
        role: userRole,
        text,
        media: mediaResults,
        schoolId: currentUser?.etablissement || 'default_school'
      });

      // Send automated notification to parents and students
      try {
        await notifyAllUsers(
          'Nouvelle publication dans votre classe',
          `${authorName} a partagé une nouvelle histoire.`,
          'info',
          'newsfeed'
        );
      } catch (notifErr) {
        console.warn('Notification trigger warning:', notifErr);
      }

      setUploadProgress(100);
      setText('');
      setSelectedItems([]);
      setIsOpen(false);
      notifySuccess('Histoire publiée avec succès !');
    } catch (err) {
      console.error('Error publishing story:', err);
      notifyError('Erreur lors de la publication de l\'histoire.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700/80 p-4 sm:p-5 mb-6 transition-all">
      {!isOpen ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {currentUser?.photo ? (
              <img
                src={currentUser.photo}
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                {authorName.substring(0, 2)}
              </div>
            )}
            <button
              onClick={() => setIsOpen(true)}
              className="flex-1 text-left bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 transition-all truncate"
            >
              Partager une information avec votre classe...
            </button>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-colors shrink-0"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Ajouter une histoire</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {currentUser?.photo ? (
                <img
                  src={currentUser.photo}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold uppercase">
                  {authorName.substring(0, 2)}
                </div>
              )}
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{authorName}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Partager avec la classe</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isSubmitting) setIsOpen(false);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Partager une information avec votre classe... (Événements, devoirs, photos de classe, annonces)"
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none min-h-[100px]"
            rows={4}
            disabled={isSubmitting}
          />

          {/* Selected Media Previews */}
          <MediaPreview
            items={selectedItems}
            onRemove={handleRemoveFile}
            isUploading={isSubmitting}
            uploadProgress={uploadProgress}
          />

          {/* Media Attachments Bar */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
            <MediaUploader
              onFilesSelected={handleAddFiles}
              onError={notifyError}
              disabled={isSubmitting}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={(!text.trim() && selectedItems.length === 0) || isSubmitting}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send size={16} />
                <span>Publier</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
