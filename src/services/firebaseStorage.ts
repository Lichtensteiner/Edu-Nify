import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export interface UploadedMedia {
  type: 'image' | 'video' | 'document';
  url: string;
  name: string;
  size: number;
  format: string;
}

const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_VIDEO_EXTS = ['mp4', 'mov', 'webm'];
const ALLOWED_DOC_EXTS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

export function getFileType(fileName: string): 'image' | 'video' | 'document' | null {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ALLOWED_IMAGE_EXTS.includes(ext)) return 'image';
  if (ALLOWED_VIDEO_EXTS.includes(ext)) return 'video';
  if (ALLOWED_DOC_EXTS.includes(ext)) return 'document';
  return null;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const type = getFileType(file.name);

  if (!type) {
    return {
      valid: false,
      error: `Format de fichier non supporté (${ext.toUpperCase()}). Formats acceptés : JPG, PNG, WEBP, MP4, MOV, WEBM, PDF, DOC, XLS, PPT.`
    };
  }

  // Size constraints
  if (type === 'image' && file.size > 20 * 1024 * 1024) {
    return { valid: false, error: `L'image "${file.name}" dépasse la limite de 20 Mo.` };
  }
  if (type === 'video' && file.size > 100 * 1024 * 1024) {
    return { valid: false, error: `La vidéo "${file.name}" dépasse la limite de 100 Mo.` };
  }
  if (type === 'document' && file.size > 25 * 1024 * 1024) {
    return { valid: false, error: `Le document "${file.name}" dépasse la limite de 25 Mo.` };
  }

  return { valid: true };
}

/**
 * Compresses images in browser using Canvas to reduce file size before uploading
 */
export async function compressImage(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.8): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file;
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(file);
    }, 3000);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        clearTimeout(timeout);
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(file);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      clearTimeout(timeout);
      resolve(file);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a file/blob to Data URL as fallback if Firebase Storage fails or hangs
 */
export function fileToDataURL(file: Blob | File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads media file to Firebase Storage under path:
 * stories/{schoolId}/{userId}/{timestamp}_{fileName}
 * Times out after 5s to seamlessly fall back to DataURL if Storage bucket is not available or blocked.
 */
export async function uploadStoryMedia(
  file: File,
  schoolId: string = 'default_school',
  userId: string = 'unknown_user',
  onProgress?: (progress: number) => void
): Promise<UploadedMedia> {
  const type = getFileType(file.name) || 'document';
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (onProgress) onProgress(20);

  let blobToUpload: Blob = file;
  if (type === 'image') {
    try {
      blobToUpload = await compressImage(file);
    } catch (err) {
      console.warn('Image compression fallback:', err);
    }
  }

  if (onProgress) onProgress(40);

  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `stories/${schoolId}/${userId}/${Date.now()}_${sanitizedFileName}`;

  let url: string = '';

  const tryFirebaseStorageUpload = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      let isSettled = false;
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, blobToUpload);

      // 5 second timeout to prevent hanging if Firebase Storage is blocked/unconfigured
      const timeoutId = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          try {
            uploadTask.cancel();
          } catch (e) {
            // Ignore cancel errors
          }
          reject(new Error('Firebase Storage upload timeout'));
        }
      }, 5000);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (isSettled) return;
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          const scaledProgress = 40 + Math.round((progress * 50) / 100);
          if (onProgress) onProgress(scaledProgress);
        },
        (error) => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timeoutId);
            reject(error);
          }
        },
        async () => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timeoutId);
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (err) {
              reject(err);
            }
          }
        }
      );
    });
  };

  try {
    url = await tryFirebaseStorageUpload();
    if (onProgress) onProgress(100);
  } catch (storageError) {
    console.warn('Firebase Storage upload unavailable or timed out, utilizing resilient Data URL fallback:', storageError);
    if (onProgress) onProgress(70);
    url = await fileToDataURL(blobToUpload);
    if (onProgress) onProgress(100);
  }

  return {
    type,
    url,
    name: file.name,
    size: file.size,
    format: ext
  };
}

