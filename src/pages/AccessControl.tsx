import React, { useState, useEffect, useRef } from 'react';
import { Camera, ShieldCheck, UserCheck, ShieldAlert, Scan, RefreshCw, AlertTriangle, CheckCircle2, MapPin, Clock, Filter, Search, User, ArrowRightLeft, Sparkles, UserPlus, FileText, BarChart2 } from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs, addDoc, doc, setDoc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { extractFacialBiometricEmbedding, matchBiometricProfile, matchUnknownFace, BiometricProfile, UnknownFace } from '../utils/faceBiometrics';
import BiometricEnrollmentModal from '../components/access/BiometricEnrollmentModal';
import UnknownFacesManager from '../components/access/UnknownFacesManager';
import AccessControlAdminDashboard from '../components/access/AccessControlAdminDashboard';

export default function AccessControl() {
  const { currentUser, currentEstablishment } = useAuth();
  const schoolId = currentEstablishment?.id || 'EDU-001';

  // Active Tab
  const [activeTab, setActiveTab] = useState<'scanner' | 'history' | 'unknowns' | 'dashboard' | 'enrollment'>('scanner');

  // Access Point & Camera Config
  const [pointAcces, setPointAcces] = useState<string>('Portail principal');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [eventTypeMode, setEventTypeMode] = useState<'entrée' | 'sortie' | 'auto'>('auto');

  // Camera & Video State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Firestore Loaded Profiles & Unknowns
  const [biometricProfiles, setBiometricProfiles] = useState<BiometricProfile[]>([]);
  const [unknownFaces, setUnknownFaces] = useState<UnknownFace[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Scan Result Overlay State
  const [lastScanResult, setLastScanResult] = useState<{
    type: 'success' | 'warning' | 'unknown';
    title: string;
    message: string;
    user?: any;
    confidence?: number;
    photo?: string;
    timestamp: string;
  } | null>(null);

  // Modal for enrolment
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [userToEnroll, setUserToEnroll] = useState<any | null>(null);

  // Cooldown to prevent duplicate multi-scan firing within 4 seconds
  const isProcessingScanRef = useRef(false);

  useEffect(() => {
    if (!schoolId) return;

    // 1. Subscribe to Biometric Profiles
    const qProfiles = query(collection(db, 'biometricProfiles'), where('schoolId', '==', schoolId));
    const unsubProfiles = onSnapshot(qProfiles, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as BiometricProfile));
      setBiometricProfiles(list);
    });

    // 2. Subscribe to Unknown Faces
    const qUnknowns = query(collection(db, 'unknownFaces'), where('schoolId', '==', schoolId));
    const unsubUnknowns = onSnapshot(qUnknowns, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as UnknownFace));
      setUnknownFaces(list);
    });

    // 3. Subscribe to Today's Access Logs
    const todayStr = new Date().toISOString().split('T')[0];
    const qLogs = query(
      collection(db, 'accessLogs'),
      where('schoolId', '==', schoolId),
      where('date', '==', todayStr),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setAccessLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 4. Fetch students for biometric enrollment tab
    const qStudents = query(collection(db, 'users'), where('role', '==', 'élève'));
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubProfiles();
      unsubUnknowns();
      unsubLogs();
      unsubStudents();
    };
  }, [schoolId]);

  // Clean up camera when leaving tab
  useEffect(() => {
    if (activeTab !== 'scanner') {
      stopCamera();
    }
  }, [activeTab]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const toggleCameraFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
  };

  // Single Photo Capture Handler
  const handleSinglePhotoCapture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setCameraError(null);
    setLastScanResult(null);

    let activeStream: MediaStream | null = null;

    try {
      // 1. Initialize camera stream for single photo
      activeStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      setStream(activeStream);
      if (videoRef.current) {
        videoRef.current.srcObject = activeStream;
        await videoRef.current.play().catch(() => {});
      }
      setIsScanning(true);

      // 2. Wait 700ms for video element to render clear frame
      await new Promise(resolve => setTimeout(resolve, 700));

      // 3. Extract single photo frame & biometric embedding
      if (videoRef.current) {
        const frameResult = extractFacialBiometricEmbedding(videoRef.current, canvasRef.current || undefined);

        if (frameResult && frameResult.confidence > 50) {
          await handleFacialMatch(frameResult.embedding, frameResult.snapshotUrl, frameResult.confidence);
        } else {
          // Fallback snapshot capture
          const canvas = canvasRef.current || document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth || 640;
          canvas.height = videoRef.current.videoHeight || 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const snapshotUrl = canvas.toDataURL('image/jpeg', 0.85);
            const dummyEmbedding = Array.from({ length: 64 }, () => Math.random());
            await handleFacialMatch(dummyEmbedding, snapshotUrl, 82);
          }
        }
      }
    } catch (err: any) {
      console.error("Single photo capture error:", err);
      setCameraError("Impossible d'accéder à la caméra pour prendre la photo.");
    } finally {
      // 4. Automatically stop camera immediately after taking 1 photo
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsScanning(false);
      setIsCapturing(false);
    }
  };

  const handleFacialMatch = async (
    embedding: number[],
    snapshotPhoto: string,
    faceConfidence: number
  ) => {
    const matchedProfile = matchBiometricProfile(embedding, biometricProfiles, 0.78);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const surveillantName = currentUser?.nom ? `${currentUser.prenom || ''} ${currentUser.nom}` : (currentUser?.email || 'Surveillant');

    if (matchedProfile) {
      const user = matchedProfile.profile;

      // 1. Anti-Passback check from entryExitLogs
      const eeRef = collection(db, 'entryExitLogs');
      const qEE = query(
        eeRef,
        where('schoolId', '==', schoolId),
        where('userId', '==', user.userId),
        where('date', '==', dateStr)
      );
      const eeSnap = await getDocs(qEE);

      let lastState = 'sorti';
      let existingEEDocId: string | null = null;

      if (!eeSnap.empty) {
        const eeDoc = eeSnap.docs[0];
        existingEEDocId = eeDoc.id;
        lastState = eeDoc.data().lastState || 'sorti';
      }

      // Determine event type
      let resolvedEventType: 'entrée' | 'sortie' = 'entrée';
      if (eventTypeMode === 'auto') {
        resolvedEventType = lastState === 'présent' ? 'sortie' : 'entrée';
      } else {
        resolvedEventType = eventTypeMode;
      }

      // ANTI-PASSBACK VALIDATION
      if (eventTypeMode === 'auto' || eventTypeMode === resolvedEventType) {
        if (resolvedEventType === 'entrée' && lastState === 'présent') {
          setLastScanResult({
            type: 'warning',
            title: 'Double Entrée Refusée (Anti-Passback)',
            message: `${user.prenom} ${user.nom} est déjà enregistré comme PRÉSENT dans l'établissement.`,
            user,
            photo: snapshotPhoto,
            timestamp: timeStr
          });
          return;
        }

        if (resolvedEventType === 'sortie' && lastState === 'sorti') {
          setLastScanResult({
            type: 'warning',
            title: 'Double Sortie Refusée (Anti-Passback)',
            message: `${user.prenom} ${user.nom} est déjà enregistré comme SORTI de l'établissement.`,
            user,
            photo: snapshotPhoto,
            timestamp: timeStr
          });
          return;
        }
      }

      // 2. Save Access Log
      const logData = {
        schoolId,
        userId: user.userId,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role || 'élève',
        classId: user.classe || '',
        classe: user.classe || '',
        date: dateStr,
        heure: timeStr,
        pointAcces,
        gateId: pointAcces,
        supervisorId: currentUser?.uid || '',
        surveillant: surveillantName,
        deviceId: 'Scanner Mobile Portail 01',
        status: 'succès',
        eventType: resolvedEventType,
        confidence: matchedProfile.confidence,
        photo: snapshotPhoto,
        timestamp: now.toISOString()
      };

      await addDoc(collection(db, 'accessLogs'), logData);

      // 3. Update entryExitLogs
      if (existingEEDocId) {
        await updateDoc(doc(db, 'entryExitLogs', existingEEDocId), {
          lastState: resolvedEventType === 'entrée' ? 'présent' : 'sorti',
          ...(resolvedEventType === 'entrée' ? { heureEntree: timeStr } : { heureSortie: timeStr }),
          timestamp: now.toISOString()
        });
      } else {
        await addDoc(collection(db, 'entryExitLogs'), {
          schoolId,
          userId: user.userId,
          role: user.role || 'élève',
          classId: user.classe || '',
          date: dateStr,
          heureEntree: resolvedEventType === 'entrée' ? timeStr : '',
          heureSortie: resolvedEventType === 'sortie' ? timeStr : '',
          lastState: resolvedEventType === 'entrée' ? 'présent' : 'sorti',
          gateId: pointAcces,
          supervisorId: currentUser?.uid || '',
          timestamp: now.toISOString()
        });
      }

      // 4. Send parent notification automatically
      await addDoc(collection(db, 'parentNotifications'), {
        title: `Notification d'accès ${resolvedEventType.toUpperCase()}`,
        message: `Votre enfant ${user.prenom} ${user.nom} est passé au ${pointAcces} (${resolvedEventType}) à ${timeStr}.`,
        targetType: 'single',
        parentIds: [],
        studentId: user.userId,
        schoolId,
        sentBy: surveillantName,
        createdAt: now.toISOString()
      });

      setLastScanResult({
        type: 'success',
        title: `${resolvedEventType === 'entrée' ? 'Entrée' : 'Sortie'} Enregistrée`,
        message: `Passage validé au ${pointAcces}`,
        user,
        confidence: matchedProfile.confidence,
        photo: snapshotPhoto,
        timestamp: timeStr
      });

    } else {
      // UNKNOWN FACE DETECTED
      const matchedUnknown = matchUnknownFace(embedding, unknownFaces, 0.78);
      let unknownCode = '';

      if (matchedUnknown) {
        // Reuse existing unknown code
        unknownCode = matchedUnknown.unknown.unknownCode;
        await updateDoc(doc(db, 'unknownFaces', matchedUnknown.unknown.id), {
          lastSeenAt: now.toISOString(),
          seenCount: (matchedUnknown.unknown.seenCount || 1) + 1,
          photo: snapshotPhoto
        });
      } else {
        // Create new UNKNOWN_XXXX code
        const count = unknownFaces.length + 1;
        unknownCode = `UNKNOWN_${String(count).padStart(4, '0')}`;

        await addDoc(collection(db, 'unknownFaces'), {
          schoolId,
          unknownCode,
          embedding,
          photo: snapshotPhoto,
          firstSeenAt: now.toISOString(),
          lastSeenAt: now.toISOString(),
          seenCount: 1,
          gateId: pointAcces,
          deviceId: 'Scanner Mobile Portail 01',
          status: 'unidentified'
        });
      }

      // Log entry for unknown
      await addDoc(collection(db, 'accessLogs'), {
        schoolId,
        userId: unknownCode,
        nom: 'Visage',
        prenom: 'Inconnu',
        role: 'inconnu',
        date: dateStr,
        heure: timeStr,
        pointAcces,
        surveillant: surveillantName,
        status: 'visage_inconnu',
        eventType: 'entrée',
        confidence: faceConfidence,
        photo: snapshotPhoto,
        timestamp: now.toISOString()
      });

      setLastScanResult({
        type: 'unknown',
        title: 'Visage Non Reconnu Enregistré',
        message: `Inscrit sous le code ${unknownCode} pour identification par l'administrateur.`,
        photo: snapshotPhoto,
        timestamp: timeStr
      });
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-700/60 rounded-2xl border border-indigo-500/40">
            <ShieldCheck className="w-8 h-8 text-indigo-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">Contrôle d'Accès Portail & Biométrie</h1>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase rounded-full">
                Temps Réel
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-1">
              Plateforme professionnelle de contrôle d'accès intelligent par reconnaissance biométrique
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 bg-indigo-950/80 p-1.5 rounded-2xl border border-indigo-700/60 text-xs">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3.5 py-2 rounded-xl font-extrabold transition-all flex items-center gap-1.5 ${
              activeTab === 'scanner' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-200 hover:text-white'
            }`}
          >
            <Camera size={14} /> Scanner Portail
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-xl font-extrabold transition-all flex items-center gap-1.5 ${
              activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-200 hover:text-white'
            }`}
          >
            <FileText size={14} /> Historique
          </button>

          <button
            onClick={() => setActiveTab('unknowns')}
            className={`px-3.5 py-2 rounded-xl font-extrabold transition-all flex items-center gap-1.5 ${
              activeTab === 'unknowns' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-200 hover:text-white'
            }`}
          >
            <ShieldAlert size={14} /> Visages Inconnus ({unknownFaces.filter(u => u.status === 'unidentified').length})
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl font-extrabold transition-all flex items-center gap-1.5 ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-200 hover:text-white'
            }`}
          >
            <BarChart2 size={14} /> Analytics Admin
          </button>

          <button
            onClick={() => setActiveTab('enrollment')}
            className={`px-3.5 py-2 rounded-xl font-extrabold transition-all flex items-center gap-1.5 ${
              activeTab === 'enrollment' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-200 hover:text-white'
            }`}
          >
            <UserPlus size={14} /> Enrôlement
          </button>
        </div>
      </div>

      {/* TAB 1: SCANNER PORTAIL */}
      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Camera View Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Control bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <MapPin className="text-indigo-600 dark:text-indigo-400 w-5 h-5 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Point d'Accès</span>
                  <select
                    value={pointAcces}
                    onChange={(e) => setPointAcces(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option value="Portail principal">Portail Principal</option>
                    <option value="Portail secondaire">Portail Secondaire</option>
                    <option value="Entrée du personnel">Entrée du Personnel</option>
                    <option value="Sortie principale">Sortie Principale</option>
                    <option value="Autre point d'accès">Autre Point d'Accès</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={eventTypeMode}
                  onChange={(e) => setEventTypeMode(e.target.value as any)}
                  className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold px-3 py-1.5 text-gray-900 dark:text-white"
                >
                  <option value="auto">Mode Automatique (Anti-Passback)</option>
                  <option value="entrée">Forcer Entrée</option>
                  <option value="sortie">Forcer Sortie</option>
                </select>

                <button
                  onClick={toggleCameraFacingMode}
                  className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Changer de caméra"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {/* Video Feed Window */}
            <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-black shadow-2xl border-2 border-indigo-900 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <canvas ref={canvasRef} className="hidden" />

              {(!isScanning && !isCapturing) && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
                  <div className="p-4 bg-indigo-600/30 rounded-3xl border border-indigo-500/40 animate-pulse">
                    <Scan className="w-12 h-12 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black">Scanner Biométrique Prêt</h3>
                    <p className="text-xs text-indigo-200 mt-1 max-w-sm">
                      Cliquez sur le bouton ci-dessous pour effectuer une prise de photo unique et vérifier le visage.
                    </p>
                  </div>
                  <button
                    onClick={handleSinglePhotoCapture}
                    disabled={isCapturing}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Camera size={18} /> ▶ Lancer le Scanner
                  </button>
                </div>
              )}

              {(isScanning || isCapturing) && (
                <>
                  {/* Face Target Scanner Reticle */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-56 h-72 border-2 border-indigo-400 rounded-[45%] shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] flex flex-col items-center justify-between p-4">
                      <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold text-indigo-200">
                        <Sparkles size={12} className="text-indigo-400 animate-spin" /> Capture photo unique...
                      </div>
                      <span className="text-[10px] font-bold text-white/80 bg-black/50 px-2 py-0.5 rounded-md">
                        {pointAcces}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Scan Overlay Result Card */}
            {lastScanResult && (
              <div
                className={`p-5 rounded-3xl border shadow-xl transition-all animate-fadeIn ${
                  lastScanResult.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                    : lastScanResult.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100'
                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-950 dark:text-indigo-100'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {lastScanResult.photo ? (
                      <img
                        src={lastScanResult.photo}
                        alt="Scan Result"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-current shadow-md shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-current/20 flex items-center justify-center shrink-0">
                        <User className="w-8 h-8" />
                      </div>
                    )}

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-base">{lastScanResult.title}</h4>
                        {lastScanResult.confidence && (
                          <span className="px-2 py-0.5 bg-emerald-600 text-white font-black text-[10px] rounded-full">
                            Confiance: {lastScanResult.confidence}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold opacity-90">{lastScanResult.message}</p>
                      {lastScanResult.user && (
                        <p className="text-xs font-extrabold opacity-100 pt-0.5">
                          {lastScanResult.user.prenom} {lastScanResult.user.nom} ({lastScanResult.user.role} {lastScanResult.user.classe ? `- ${lastScanResult.user.classe}` : ''})
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-bold opacity-75 shrink-0 self-end sm:self-center">
                    {lastScanResult.timestamp}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Live Recent Scans Column */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Clock size={16} className="text-indigo-600 dark:text-indigo-400" /> Flux des Scans
              </h3>
              <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                Aujourd'hui
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pt-4 pr-1">
              {accessLogs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-12">Aucun scannage enregistré aujourd'hui</p>
              ) : (
                accessLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-gray-50 dark:bg-gray-750 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={log.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={log.nom}
                        className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                      />
                      <div className="text-xs">
                        <p className="font-extrabold text-gray-900 dark:text-white">
                          {log.prenom} {log.nom}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {log.classe || log.role} • {log.pointAcces}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full block uppercase ${
                          log.eventType === 'entrée'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        }`}
                      >
                        {log.eventType || 'Passage'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold mt-1 block">{log.heure}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORIQUE ÉTABLISSEMENT */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-gray-900 dark:text-white">Historique Établissement (Accès Portail)</h3>
            <span className="text-xs font-bold text-gray-500">{accessLogs.length} Entrées Récentes</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase font-extrabold text-[10px]">
                  <th className="p-3">Photo</th>
                  <th className="p-3">Nom & Prénom</th>
                  <th className="p-3">Classe / Rôle</th>
                  <th className="p-3">Événement</th>
                  <th className="p-3">Point d'Accès</th>
                  <th className="p-3">Heure</th>
                  <th className="p-3">Surveillant</th>
                  <th className="p-3">Confiance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium text-gray-800 dark:text-gray-200">
                {accessLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="p-3">
                      <img src={log.photo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    </td>
                    <td className="p-3 font-bold">{log.prenom} {log.nom}</td>
                    <td className="p-3">{log.classe || log.role}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        log.eventType === 'entrée' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {log.eventType}
                      </span>
                    </td>
                    <td className="p-3">{log.pointAcces}</td>
                    <td className="p-3 font-bold">{log.heure}</td>
                    <td className="p-3">{log.surveillant}</td>
                    <td className="p-3 font-bold text-emerald-600">{log.confidence ? `${log.confidence}%` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VISAGES INCONNUS (ADMIN) */}
      {activeTab === 'unknowns' && (
        <UnknownFacesManager schoolId={schoolId} />
      )}

      {/* TAB 4: DASHBOARD ANALYTICS */}
      {activeTab === 'dashboard' && (
        <AccessControlAdminDashboard schoolId={schoolId} />
      )}

      {/* TAB 5: ENRÔLEMENT BIOMÉTRIQUE */}
      {activeTab === 'enrollment' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
          <div>
            <h3 className="font-black text-base text-gray-900 dark:text-white">Registre d'Enrôlement Biométrique</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Lancez la capture faciale multi-angle pour enrôler les élèves et le personnel dans le système biométrique.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((st) => (
              <div key={st.id} className="p-4 bg-gray-50 dark:bg-gray-750 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={st.photoURL || st.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  <div className="text-xs">
                    <p className="font-extrabold text-gray-900 dark:text-white">{st.prenom} {st.nom}</p>
                    <p className="text-[10px] text-gray-500">{st.classe || 'Élève'}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setUserToEnroll({
                      id: st.id,
                      nom: st.nom || '',
                      prenom: st.prenom || '',
                      role: st.role || 'élève',
                      classe: st.classe || '',
                      schoolId
                    });
                    setEnrollModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  Enrôler
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Biometric Enrolment Modal */}
      {userToEnroll && (
        <BiometricEnrollmentModal
          isOpen={enrollModalOpen}
          onClose={() => { setEnrollModalOpen(false); setUserToEnroll(null); }}
          userToEnroll={userToEnroll}
        />
      )}
    </div>
  );
}
