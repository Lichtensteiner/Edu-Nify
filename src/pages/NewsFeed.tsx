import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { Story, subscribeToStories } from '../services/storyService';
import { StoryCreator } from '../components/StoryCreator';
import { StoryCard } from '../components/StoryCard';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserInfo {
  id: string;
  nom: string;
  prenom: string;
  photo?: string;
}

export default function NewsFeed() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { notifySuccess, notifyError, notifyDelete } = useNotification();

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal for Likes & Views
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalStoryId, setModalStoryId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'likes' | 'views' | null>(null);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [modalUsers, setModalUsers] = useState<UserInfo[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Subscribe to real-time stories
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToStories((fetchedStories) => {
      setStories(fetchedStories);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch user information when interaction modal opens
  useEffect(() => {
    if (!showUsersModal || activeIds.length === 0) {
      setModalUsers([]);
      return;
    }

    const fetchUsers = async () => {
      setModalLoading(true);
      try {
        const chunks = [];
        for (let i = 0; i < activeIds.length; i += 30) {
          chunks.push(activeIds.slice(i, i + 30));
        }

        const allUsers: UserInfo[] = [];
        for (const chunk of chunks) {
          const q = query(collection(db, 'users'), where('id', 'in', chunk));
          const snap = await getDocs(q);
          snap.docs.forEach((doc) => {
            const data = doc.data();
            allUsers.push({
              id: doc.id,
              nom: data.nom || '',
              prenom: data.prenom || '',
              photo: data.photo
            });
          });
        }
        setModalUsers(allUsers);
      } catch (error) {
        console.error('Error fetching modal users:', error);
      } finally {
        setModalLoading(false);
      }
    };

    fetchUsers();
  }, [showUsersModal, activeIds]);

  const showInteractionUsers = (title: string, userIds: string[], storyId: string, type: 'likes' | 'views') => {
    setModalTitle(title);
    setModalStoryId(storyId);
    setModalType(type);
    setActiveIds(userIds || []);
    setShowUsersModal(true);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Class Story Creator */}
      <StoryCreator
        currentUser={currentUser}
        notifySuccess={notifySuccess}
        notifyError={notifyError}
      />

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-xs text-gray-500 font-medium">Chargement du fil d'actualité...</p>
        </div>
      )}

      {/* Stories Feed */}
      {!loading && (
        <div className="space-y-6">
          {stories.map((story) => {
            // Update active modal list if real-time changes occur for open modal
            if (showUsersModal && modalStoryId === story.id) {
              const currentIds = modalType === 'likes' ? story.likes : story.viewers;
              if (JSON.stringify(currentIds) !== JSON.stringify(activeIds)) {
                setActiveIds(currentIds || []);
              }
            }

            return (
              <StoryCard
                key={story.id}
                story={story}
                currentUser={currentUser}
                onShowInteractions={showInteractionUsers}
                notifySuccess={notifySuccess}
                notifyError={notifyError}
                notifyDelete={notifyDelete}
              />
            );
          })}

          {stories.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
              <MessageSquare size={48} className="mx-auto text-indigo-400 dark:text-indigo-500 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Aucune publication dans l'Histoire</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Partagez des annonces, des photos, des vidéos ou des documents de classe avec vos élèves et parents.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Interaction Users Modal */}
      <AnimatePresence>
        {showUsersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">{modalTitle}</h3>
                <button
                  onClick={() => setShowUsersModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto p-2">
                {modalLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                ) : modalUsers.length === 0 ? (
                  <p className="text-center py-8 text-gray-500 text-sm">Aucun utilisateur trouvé.</p>
                ) : (
                  <div className="space-y-1">
                    {modalUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
                      >
                        {user.photo ? (
                          <img
                            src={user.photo}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold shrink-0 uppercase">
                            {user.prenom?.[0]}
                            {user.nom?.[0]}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                            {user.prenom} {user.nom}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
