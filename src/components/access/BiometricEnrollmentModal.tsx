import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, RefreshCw, X, ShieldCheck, Sparkles, AlertCircle, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, User } from 'lucide-react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { extractFacialBiometricEmbedding } from '../../utils/faceBiometrics';
import { useAuth } from '../../contexts/AuthContext';

interface BiometricEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEnroll: {
    id: string;
    nom: string;
    prenom: string;
    role: string;
    classe?: string;
    matricule?: string;
    photo?: string;
    schoolId?: string;
  };
  onSuccess?: () => void;
}

const ANGLES = [
  { id: 'face', title: 'Vue de Face', desc: 'Regardez directement l\'objectif de la caméra', icon: User },
  { id: 'left', title: 'Légèrement à gauche', desc: 'Tournez la tête légèrement vers la gauche', icon: ArrowLeft },
  { id: 'right', title: 'Légèrement à droite', desc: 'Tournez la tête légèrement vers la droite', icon: ArrowRight },
  { id: 'up', title: 'Regard vers le haut', desc: 'Inclinez votre visage légèrement vers le haut', icon: ArrowUp },
  { id: 'down', title: 'Regard vers le bas', desc: 'Inclinez votre visage légèrement vers le bas', icon: ArrowDown }
];

export default function BiometricEnrollmentModal({
  isOpen,
  onClose,
  userToEnroll,
  onSuccess
}: BiometricEnrollmentModalProps) {
  const { currentUser } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [capturedAngles, setCapturedAngles] = useState<Array<{
    angleId: string;
    embedding: number[];
    photo: string;
  }>>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
      setCurrentAngleIndex(0);
      setCapturedAngles([]);
      setIsComplete(false);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCaptureAngle = () => {
    if (!videoRef.current || isCapturing) return;
    setIsCapturing(true);

    const result = extractFacialBiometricEmbedding(videoRef.current, canvasRef.current || undefined);

    if (!result) {
      setCameraError("Aucun visage net n'a été détecté dans le cadre. Ajustez votre position et réessayez.");
      setIsCapturing(false);
      return;
    }

    setCameraError(null);
    const angleInfo = ANGLES[currentAngleIndex];

    const newCapture = {
      angleId: angleInfo.id,
      embedding: result.embedding,
      photo: result.snapshotUrl
    };

    const updated = [...capturedAngles, newCapture];
    setCapturedAngles(updated);

    if (currentAngleIndex < ANGLES.length - 1) {
      setCurrentAngleIndex(prev => prev + 1);
      setIsCapturing(false);
    } else {
      // Finished all 5 angles -> save to Firestore
      saveBiometricProfile(updated);
    }
  };

  const saveBiometricProfile = async (allCaptures: typeof capturedAngles) => {
    setIsSaving(true);
    try {
      const schoolId = userToEnroll.schoolId || 'EDU-001';

      // 1. Calculate average master embedding vector across all 5 angles
      const masterEmbedding = new Array(128).fill(0);
      allCaptures.forEach(c => {
        c.embedding.forEach((val, idx) => {
          masterEmbedding[idx] += val / allCaptures.length;
        });
      });

      // Normalize master embedding vector
      const norm = Math.sqrt(masterEmbedding.reduce((acc, val) => acc + val * val, 0));
      const normalizedMaster = norm > 0 ? masterEmbedding.map(v => v / norm) : masterEmbedding;

      const profileData = {
        id: userToEnroll.id,
        userId: userToEnroll.id,
        nom: userToEnroll.nom,
        prenom: userToEnroll.prenom,
        role: userToEnroll.role,
        classe: userToEnroll.classe || '',
        matricule: userToEnroll.matricule || '',
        photo: userToEnroll.photo || allCaptures[0]?.photo || '',
        schoolId,
        embedding: normalizedMaster,
        multiAngleEmbeddings: allCaptures.map(c => c.embedding),
        anglesCaptured: allCaptures.map(c => c.angleId),
        enrolledAt: new Date().toISOString(),
        enrolledBy: currentUser?.email || currentUser?.nom || 'Admin'
      };

      // Save to biometricProfiles collection
      await setDoc(doc(db, 'biometricProfiles', userToEnroll.id), profileData);

      // Also flag user in users collection
      try {
        await updateDoc(doc(db, 'users', userToEnroll.id), {
          hasBiometrics: true,
          biometricsEnrolledAt: new Date().toISOString(),
          face_id: `BIO_${userToEnroll.id.substring(0, 8)}`
        });
      } catch (e) {
        // Fallback if user is in another collection
      }

      setIsSaving(false);
      setIsComplete(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Error saving biometric profile:", err);
      setCameraError("Erreur lors de l'enregistrement dans la base de données: " + err.message);
      setIsSaving(false);
      setIsCapturing(false);
    }
  };

  if (!isOpen) return null;

  const currentAngle = ANGLES[currentAngleIndex];
  const IconComponent = currentAngle?.icon || User;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-indigo-900 to-indigo-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-700/60 rounded-2xl border border-indigo-500/40">
              <ShieldCheck className="w-6 h-6 text-indigo-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Enrôlement Biométrique Facial</h3>
              <p className="text-xs text-indigo-200">
                {userToEnroll.prenom} {userToEnroll.nom} ({userToEnroll.role} {userToEnroll.classe ? `- ${userToEnroll.classe}` : ''})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {isComplete ? (
            <div className="py-8 flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                <h4 className="text-xl font-black text-gray-900 dark:text-white">Modèle Biométrique Créé avec Succès !</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                  Les 5 angles faciaux ont été compilés et enregistrés dans le registre de sécurité Edu-Nify. La reconnaissance automatique au portail est maintenant active.
                </p>
              </div>

              {/* Display captured angles */}
              <div className="grid grid-cols-5 gap-2 w-full pt-4">
                {capturedAngles.map((c, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <img src={c.photo} alt={`Angle ${idx + 1}`} className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500 shadow-sm" />
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 mt-1 capitalize">{c.angleId}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="mt-6 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg transition-transform active:scale-95"
              >
                Terminer & Fermer
              </button>
            </div>
          ) : (
            <>
              {/* Stepper Header */}
              <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                    {currentAngleIndex + 1}/5
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Étape actuelle</span>
                    <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">{currentAngle.title}</h4>
                  </div>
                </div>
                <IconComponent className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 text-center font-medium bg-gray-50 dark:bg-gray-750 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700">
                💡 {currentAngle.desc}
              </p>

              {/* Camera Preview Canvas */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner border border-gray-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Facial Oval Overlay Target */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-64 border-2 border-dashed border-indigo-400/80 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center">
                    <span className="text-[11px] font-bold text-indigo-200 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                      Aligner le visage ici
                    </span>
                  </div>
                </div>

                {isCapturing && (
                  <div className="absolute inset-0 bg-indigo-900/60 backdrop-blur-sm flex items-center justify-center text-white">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-8 h-8 animate-spin text-indigo-200" />
                      <span className="text-xs font-bold">Analyse vectorielle biométrique en cours...</span>
                    </div>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{cameraError}</p>
                </div>
              )}

              {/* Captured Progress Badges */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {ANGLES.map((ang, idx) => {
                  const isDone = idx < currentAngleIndex;
                  const isCurrent = idx === currentAngleIndex;
                  return (
                    <div
                      key={ang.id}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isDone
                          ? 'w-8 bg-emerald-500'
                          : isCurrent
                          ? 'w-10 bg-indigo-600 animate-pulse'
                          : 'w-4 bg-gray-200 dark:bg-gray-700'
                      }`}
                      title={ang.title}
                    />
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>

                <button
                  onClick={handleCaptureAngle}
                  disabled={isCapturing || isSaving}
                  className="flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {isSaving ? 'Sauvegarde...' : `Capturer l'Angle ${currentAngleIndex + 1}/5`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
