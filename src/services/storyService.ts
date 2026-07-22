import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  getDocs,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UploadedMedia } from './firebaseStorage';

import { moveToTrash } from './trashService';

export interface CommentItem {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  text: string;
  createdAt: any;
}

export interface Story {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  role?: string;
  text: string;
  content?: string;
  media: UploadedMedia[];
  createdAt: any;
  likes: string[];
  views: number;
  viewers?: string[];
  commentsCount?: number;
  schoolId?: string;
  classId?: string;
}

export interface CreateStoryParams {
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string | null;
  role?: string;
  text: string;
  media: UploadedMedia[];
  schoolId?: string;
  classId?: string;
}

const STORIES_COLLECTION = 'stories';
const POSTS_COLLECTION = 'posts';

/**
 * Creates a new Class Story publication in Firestore.
 * Saves in both 'stories' and synced with 'posts' for backward compatibility.
 */
export async function createStory(params: CreateStoryParams): Promise<string> {
  const storyData = {
    authorId: params.authorId,
    authorName: params.authorName,
    authorPhotoUrl: params.authorPhotoUrl || null,
    role: params.role || 'enseignant',
    text: params.text.trim(),
    content: params.text.trim(), // backward compatibility
    media: params.media || [],
    mediaUrl: params.media.length > 0 ? params.media[0].url : null, // legacy field
    mediaType: params.media.length > 0 ? params.media[0].type : null, // legacy field
    createdAt: serverTimestamp(),
    likes: [],
    views: 0,
    viewers: [],
    commentsCount: 0,
    schoolId: params.schoolId || 'default',
    classId: params.classId || null
  };

  try {
    const docRef = await addDoc(collection(db, STORIES_COLLECTION), storyData);
    
    // Sync to posts for legacy components reading /posts collection
    try {
      await addDoc(collection(db, POSTS_COLLECTION), {
        ...storyData,
        id: docRef.id
      });
    } catch (e) {
      console.warn("Legacy posts sync note:", e);
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, STORIES_COLLECTION);
    throw error;
  }
}

/**
 * Real-time listener for stories collection
 */
export function subscribeToStories(callback: (stories: Story[]) => void): () => void {
  const q = query(collection(db, STORIES_COLLECTION), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const stories = snapshot.docs
        .filter((d) => !d.data().deleted)
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            authorId: data.authorId,
            authorName: data.authorName,
            authorPhotoUrl: data.authorPhotoUrl,
            role: data.role || 'enseignant',
            text: data.text || data.content || '',
            content: data.content || data.text || '',
            media: Array.isArray(data.media)
              ? data.media
              : data.mediaUrl
              ? [{ type: data.mediaType || 'image', url: data.mediaUrl, name: 'Fichier joint', size: 0, format: '' }]
              : [],
            createdAt: data.createdAt,
            likes: Array.isArray(data.likes) ? data.likes : [],
            views: data.views || 0,
            viewers: Array.isArray(data.viewers) ? data.viewers : [],
            commentsCount: data.commentsCount || 0,
            schoolId: data.schoolId,
            classId: data.classId
          } as Story;
        });
      callback(stories);
    },
    (error) => {
      console.error('Error listening to stories:', error);
      // Fallback query from posts if stories snapshot fails
      const postsQ = query(collection(db, POSTS_COLLECTION), orderBy('createdAt', 'desc'));
      return onSnapshot(postsQ, (postSnap) => {
        const fallbackStories = postSnap.docs
          .filter((d) => !d.data().deleted)
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              authorId: data.authorId,
              authorName: data.authorName,
              authorPhotoUrl: data.authorPhotoUrl,
              role: data.role || 'enseignant',
              text: data.text || data.content || '',
              content: data.content || data.text || '',
              media: Array.isArray(data.media)
                ? data.media
                : data.mediaUrl
                ? [{ type: data.mediaType || 'image', url: data.mediaUrl, name: 'Fichier joint', size: 0, format: '' }]
                : [],
              createdAt: data.createdAt,
              likes: Array.isArray(data.likes) ? data.likes : [],
              views: data.views || 0,
              viewers: Array.isArray(data.viewers) ? data.viewers : [],
              commentsCount: data.commentsCount || 0
            } as Story;
          });
        callback(fallbackStories);
      });
    }
  );
}

/**
 * Soft deletes a story by moving it to trash
 */
export async function softDeleteStory(story: Story, currentUser: any): Promise<void> {
  const authorName = currentUser.prenom || currentUser.nom
    ? `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim()
    : currentUser.email?.split('@')[0] || 'Utilisateur';

  await moveToTrash({
    type: 'story',
    title: `${story.authorName || 'Publication'} - Histoire`,
    content: story.text || story.content || '',
    originalCollection: STORIES_COLLECTION,
    originalId: story.id,
    deletedBy: currentUser.id || currentUser.uid || '',
    deletedByName: authorName,
    data: story,
    schoolId: story.schoolId || 'default'
  });
}

/**
 * Real-time listener for comments of a story
 */
export function subscribeToComments(storyId: string, callback: (comments: CommentItem[]) => void): () => void {
  const q = query(collection(db, `${STORIES_COLLECTION}/${storyId}/comments`), orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    })) as CommentItem[];
    callback(comments);
  });
}

/**
 * Adds a comment to a story
 */
export async function addCommentToStory(
  storyId: string,
  authorId: string,
  authorName: string,
  text: string,
  authorPhotoUrl?: string
): Promise<void> {
  const commentPath = `${STORIES_COLLECTION}/${storyId}/comments`;
  try {
    await addDoc(collection(db, commentPath), {
      authorId,
      authorName,
      authorPhotoUrl: authorPhotoUrl || null,
      text: text.trim(),
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, STORIES_COLLECTION, storyId), {
      commentsCount: increment(1)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, commentPath);
  }
}

/**
 * Toggles like on a story
 */
export async function toggleLikeStory(storyId: string, userId: string, hasLiked: boolean): Promise<void> {
  const storyRef = doc(db, STORIES_COLLECTION, storyId);
  try {
    if (hasLiked) {
      await updateDoc(storyRef, {
        likes: arrayRemove(userId)
      });
    } else {
      await updateDoc(storyRef, {
        likes: arrayUnion(userId)
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${STORIES_COLLECTION}/${storyId}`);
  }
}

/**
 * Increments view count and tracks viewer
 */
export async function markStoryViewed(storyId: string, userId: string): Promise<void> {
  const storyRef = doc(db, STORIES_COLLECTION, storyId);
  try {
    await updateDoc(storyRef, {
      views: increment(1),
      viewers: arrayUnion(userId)
    });
  } catch (error) {
    // Silent fail for view counts
  }
}

/**
 * Deletes a story document
 */
export async function deleteStory(storyId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, STORIES_COLLECTION, storyId));
    try {
      await deleteDoc(doc(db, POSTS_COLLECTION, storyId));
    } catch (e) {
      // Ignore
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${STORIES_COLLECTION}/${storyId}`);
  }
}

/**
 * Updates story text
 */
export async function updateStoryText(storyId: string, text: string): Promise<void> {
  try {
    await updateDoc(doc(db, STORIES_COLLECTION, storyId), {
      text: text.trim(),
      content: text.trim()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${STORIES_COLLECTION}/${storyId}`);
  }
}
