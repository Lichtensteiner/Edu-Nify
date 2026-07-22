import React, { useState, useEffect } from 'react';
import { Story, CommentItem, subscribeToComments, addCommentToStory, toggleLikeStory, deleteStory, softDeleteStory, updateStoryText, markStoryViewed } from '../services/storyService';
import { DocumentViewer } from './DocumentViewer';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Heart, MessageCircle, Eye, MoreVertical, Edit, Trash2, Send, X, Maximize2, Sparkles, ShieldCheck, User, EyeOff, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StoryCardProps {
  story: Story;
  currentUser: any;
  onShowInteractions: (title: string, userIds: string[], storyId: string, type: 'likes' | 'views') => void;
  notifySuccess?: (msg: string) => void;
  notifyError?: (msg: string) => void;
  notifyDelete?: (msg: string) => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  currentUser,
  onShowInteractions,
  notifySuccess,
  notifyError,
  notifyDelete
}) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(story.text || story.content || '');
  const [isHiddenLocally, setIsHiddenLocally] = useState(false);

  // Modals state
  const [showSoftDeleteModal, setShowSoftDeleteModal] = useState(false);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lightbox modal state for image zoom
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  const isAuthor = currentUser?.id === story.authorId || currentUser?.uid === story.authorId;
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'Administrateur d\'établissement' || currentUser?.role === 'Super Administrateur' || currentUser?.role === 'Directeur';
  const isStudent = currentUser?.role === 'élève' || currentUser?.role === 'student';
  const hasLiked = currentUser ? story.likes?.includes(currentUser.id || currentUser.uid) : false;

  useEffect(() => {
    if (!showComments) return;
    const unsub = subscribeToComments(story.id, (fetched) => setComments(fetched));
    return () => unsub();
  }, [showComments, story.id]);

  if (isHiddenLocally) return null;

  const handleSoftDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await softDeleteStory(story, currentUser);
      setShowSoftDeleteModal(false);
      if (notifyDelete) notifyDelete('Publication déplacée dans la corbeille.');
    } catch (err) {
      if (notifyError) notifyError('Erreur lors du déplacement dans la corbeille.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePermanentDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteStory(story.id);
      setShowPermanentDeleteModal(false);
      if (notifyDelete) notifyDelete('Publication définitivement supprimée.');
    } catch (err) {
      if (notifyError) notifyError('Erreur lors de la suppression définitive.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMouseEnter = () => {
    const userId = currentUser?.id || currentUser?.uid;
    if (userId && !story.viewers?.includes(userId)) {
      markStoryViewed(story.id, userId);
    }
  };

  const handleLike = async () => {
    const userId = currentUser?.id || currentUser?.uid;
    if (!userId) return;
    await toggleLikeStory(story.id, userId, hasLiked);
  };

  const handleAddComment = async () => {
    const userId = currentUser?.id || currentUser?.uid;
    if (!newCommentText.trim() || !userId) return;

    setIsSubmittingComment(true);
    try {
      const authorName = currentUser.prenom || currentUser.nom
        ? `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim()
        : currentUser.email?.split('@')[0] || 'Utilisateur';

      await addCommentToStory(
        story.id,
        userId,
        authorName,
        newCommentText,
        currentUser.photo
      );
      setNewCommentText('');
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Voulez-vous vraiment supprimer cette publication ?')) {
      try {
        await deleteStory(story.id);
        if (notifyDelete) notifyDelete('Publication supprimée.');
      } catch (err) {
        if (notifyError) notifyError('Erreur lors de la suppression.');
      }
    }
  };

  const handleEditSave = async () => {
    if (!editText.trim()) return;
    try {
      await updateStoryText(story.id, editText);
      setIsEditing(false);
      if (notifySuccess) notifySuccess('Publication mise à jour !');
    } catch (err) {
      if (notifyError) notifyError('Erreur lors de la mise à jour.');
    }
  };

  const formattedDate = story.createdAt
    ? typeof story.createdAt.toDate === 'function'
      ? format(story.createdAt.toDate(), "d MMMM yyyy 'à' HH:mm", { locale: fr })
      : 'Récemment'
    : 'Récemment';

  const images = story.media.filter((m) => m.type === 'image');
  const videos = story.media.filter((m) => m.type === 'video');
  const documents = story.media.filter((m) => m.type === 'document');

  const roleLabel = story.role === 'admin' || story.role?.includes('Admin')
    ? 'Administration'
    : story.role === 'enseignant' || story.role === 'teacher' || story.role?.includes('Enseignant')
    ? 'Enseignant'
    : 'Personnel';

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700/80 overflow-hidden transition-all hover:shadow-md"
      onMouseEnter={handleMouseEnter}
    >
      {/* Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          {story.authorPhotoUrl ? (
            <img
              src={story.authorPhotoUrl}
              alt={story.authorName}
              className="w-11 h-11 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-900 shadow-xs"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs uppercase">
              {story.authorName.substring(0, 2)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">{story.authorName}</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                <ShieldCheck size={12} />
                {roleLabel}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formattedDate}</p>
          </div>
        </div>

        <div className="relative group">
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <MoreVertical size={20} />
          </button>
          <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hidden group-hover:block z-20 overflow-hidden">
            {(isAuthor || isAdmin) && (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 font-medium"
              >
                <Edit size={16} /> Modifier la publication
              </button>
            )}

            <button
              onClick={() => setIsHiddenLocally(true)}
              className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 font-medium"
            >
              <EyeOff size={16} /> Masquer pour moi
            </button>

            {!isStudent && (isAuthor || isAdmin) && (
              <button
                onClick={() => setShowSoftDeleteModal(true)}
                className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 font-medium border-t border-gray-100 dark:border-gray-700"
              >
                <Trash size={16} /> Mettre dans la corbeille
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setShowPermanentDeleteModal(true)}
                className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 font-medium"
              >
                <Trash2 size={16} /> Supprimer définitivement
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 space-y-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleEditSave}
                className="px-4 py-1.5 text-xs sm:text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium"
              >
                Enregistrer
              </button>
            </div>
          </div>
        ) : (
          story.text && (
            <p className="text-gray-800 dark:text-gray-100 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
              {story.text}
            </p>
          )
        )}

        {/* Media Galleries */}
        {/* Images */}
        {images.length > 0 && (
          <div
            className={`grid gap-2 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 ${
              images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
            }`}
          >
            {images.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setZoomImageUrl(img.url)}
                className="relative group cursor-pointer bg-gray-100 dark:bg-gray-900 overflow-hidden aspect-video sm:aspect-square flex items-center justify-center"
              >
                <img
                  src={img.url}
                  alt={img.name || 'Photo'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Maximize2 size={24} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <div className="space-y-3">
            {videos.map((vid, idx) => (
              <div key={idx} className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
                <video src={vid.url} controls className="w-full max-h-96 object-contain" />
              </div>
            ))}
          </div>
        )}

        {/* Documents */}
        {documents.length > 0 && (
          <div className="space-y-2.5">
            {documents.map((docItem, idx) => (
              <DocumentViewer
                key={idx}
                url={docItem.url}
                name={docItem.name}
                size={docItem.size}
                format={docItem.format}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="px-4 py-2.5 bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700/60">
        <button
          onClick={() => onShowInteractions('J\'aime', story.likes || [], story.id, 'likes')}
          className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors font-medium"
        >
          <Heart size={15} className={story.likes?.length > 0 ? 'fill-red-500 text-red-500' : ''} />
          <span>{story.likes?.length || 0} J'aime</span>
        </button>

        <div className="flex items-center gap-4">
          <button onClick={() => setShowComments(!showComments)} className="hover:underline font-medium">
            {story.commentsCount || 0} commentaires
          </button>

          <button
            onClick={() => onShowInteractions('Personnes qui ont vu', story.viewers || [], story.id, 'views')}
            className="flex items-center gap-1 hover:text-indigo-600 transition-colors font-medium"
          >
            <Eye size={15} />
            <span>{story.viewers?.length || story.views || 0} vues</span>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-3 py-1.5 flex items-center border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            hasLiked
              ? 'text-red-600 bg-red-50 dark:bg-red-950/30'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Heart size={18} className={hasLiked ? 'fill-current' : ''} />
          <span>J'aime</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            showComments
              ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <MessageCircle size={18} />
          <span>Commenter</span>
        </button>
      </div>

      {/* Comments Thread */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-700 space-y-4"
          >
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 text-xs sm:text-sm">
                  {comment.authorPhotoUrl ? (
                    <img
                      src={comment.authorPhotoUrl}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {comment.authorName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none border border-gray-200/60 dark:border-gray-700/60 shadow-2xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-gray-900 dark:text-white">{comment.authorName}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{comment.text}</p>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-xs text-gray-500 py-2">Soyez le premier à commenter !</p>
              )}
            </div>

            {/* Comment Input */}
            <div className="flex gap-2 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder="Écrivez un commentaire..."
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 text-xs sm:text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!newCommentText.trim() || isSubmittingComment}
                className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal for Image Zoom */}
      <AnimatePresence>
        {zoomImageUrl && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <button
              onClick={() => setZoomImageUrl(null)}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/40 rounded-full"
            >
              <X size={24} />
            </button>
            <img src={zoomImageUrl} alt="Zoom" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          </div>
        )}
      </AnimatePresence>

      {/* Soft Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showSoftDeleteModal}
        onClose={() => setShowSoftDeleteModal(false)}
        onConfirm={handleSoftDeleteConfirm}
        title="Déplacer dans la corbeille"
        message="Voulez-vous déplacer cette publication dans la corbeille ? Vous pourrez la restaurer à tout moment pendant 30 jours."
        confirmText="Déplacer"
        cancelText="Annuler"
        isPermanent={false}
        isLoading={isDeleting}
      />

      {/* Permanent Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showPermanentDeleteModal}
        onClose={() => setShowPermanentDeleteModal(false)}
        onConfirm={handlePermanentDeleteConfirm}
        title="Suppression définitive"
        message="Cette action est irréversible. La publication, ses médias, commentaires et réactions seront définitivement effacés. Continuer ?"
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        isPermanent={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
