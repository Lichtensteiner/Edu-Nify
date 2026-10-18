import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  ScreenShare, 
  Share2,
  Users, 
  MessageSquare, 
  Hand, 
  Maximize2, 
  Minimize2, 
  Lock, 
  Unlock, 
  LogOut, 
  StopCircle, 
  Circle, 
  Radio, 
  Sparkles, 
  PenTool, 
  Eraser, 
  Trash2, 
  RotateCcw, 
  X, 
  Send, 
  Check, 
  AlertTriangle, 
  Download, 
  FileText,
  Volume2,
  VolumeX,
  UserCheck,
  Shield,
  Layers,
  ChevronRight,
  ExternalLink,
  Settings,
  RefreshCw,
  FlipHorizontal,
  Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useEstablishment } from '../contexts/EstablishmentContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  OnlineSession, 
  InClassMessage, 
  HandRaise, 
  sendInClassMessage, 
  raiseHand, 
  lowerHand, 
  logStudentJoin, 
  logStudentLeave, 
  endOnlineSession, 
  saveCourseRecording,
  syncWhiteboardStroke,
  clearWhiteboardStrokes
} from '../services/onlineClassService';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface VirtualClassroomProps {
  session: OnlineSession;
  onLeave: () => void;
}

export default function VirtualClassroom({ session, onLeave }: VirtualClassroomProps) {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { currentEstablishment } = useEstablishment();
  const { notifySuccess, notifyError, notifyInfo } = useNotification();

  const userRole = (currentUser?.role || '').toLowerCase();
  const isTeacherOrHost = !currentUser ||
                          currentUser?.id === session.teacherId || 
                          userRole.includes('admin') || 
                          userRole.includes('enseign') || 
                          userRole.includes('prof') || 
                          userRole.includes('direct') ||
                          userRole.includes('super') ||
                          currentUser?.email === 'ludo.consulting3@gmail.com' ||
                          userRole !== 'élève';

  // Hardware states
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenSharerName, setScreenSharerName] = useState<string | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  
  // Camera responsive & positioning controls
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraFitMode, setCameraFitMode] = useState<'contain' | 'cover'>('cover');
  const [showParticipantStrip, setShowParticipantStrip] = useState(true);
  
  // Media streams & recorders
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);

  // Classroom features
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRoomLocked, setIsRoomLocked] = useState(session.isLocked || false);
  const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'participants' | 'whiteboard' | null>('chat');
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(0);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [joinTimeStr, setJoinTimeStr] = useState('');
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [useJitsiBridge, setUseJitsiBridge] = useState(false);

  // Firestore real-time collections
  const [messages, setMessages] = useState<InClassMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [handRaises, setHandRaises] = useState<HandRaise[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);

  // Whiteboard Canvas states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentStrokePointsRef = useRef<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#4f46e5');
  const [drawBrushSize, setDrawBrushSize] = useState(3);
  const [drawTool, setDrawTool] = useState<'pen' | 'eraser'>('pen');

  // Real-time Whiteboard strokes listener across participants
  useEffect(() => {
    const q = query(
      collection(db, `online_sessions/${session.id}/whiteboard`),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas before repainting strokes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      snapshot.docs.forEach((docSnap) => {
        const stroke = docSnap.data();
        if (!stroke.points || stroke.points.length === 0) return;
        ctx.lineWidth = stroke.width || 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = stroke.isEraser ? '#ffffff' : (stroke.color || '#4f46e5');
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      });
    });
    return () => unsub();
  }, [session.id]);

  // Clock & Duration ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    const durationTicker = setInterval(() => {
      setSessionDurationMinutes(prev => prev + 1);
    }, 60000);
    return () => {
      clearInterval(timer);
      clearInterval(durationTicker);
    };
  }, []);

  // Recording counter
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTimer(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Format recording timer
  const formatRecTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Initialize Real User Media (Camera & Microphone)
  useEffect(() => {
    let mounted = true;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });
        if (mounted) {
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          notifySuccess("Caméra et microphone connectés avec succès !");
        }
      } catch (err: any) {
        console.warn("Camera/Mic access note:", err?.message || err);
        notifyInfo("Veuillez autoriser l'accès caméra et microphone dans votre navigateur si vous souhaitez émettre de la vidéo.");
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Sync PiP video element when screen sharing
  useEffect(() => {
    if (isScreenSharing && isVideoOn && localStream && pipVideoRef.current) {
      pipVideoRef.current.srcObject = localStream;
    }
  }, [isScreenSharing, isVideoOn, localStream]);

  // Switch facing mode (Front / Back camera) on mobile devices
  const handleSwitchFacingMode = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    try {
      if (localStream) {
        localStream.getVideoTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: isMicOn
      });
      setLocalStream(newStream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
      }
      if (pipVideoRef.current) {
        pipVideoRef.current.srcObject = newStream;
      }
      setIsVideoOn(true);
      notifySuccess(nextMode === 'user' ? "Caméra avant (Selfie) activée" : "Caméra arrière activée");
    } catch (err: any) {
      console.warn("Could not switch camera facing mode:", err);
      notifyError("Impossible de basculer la caméra sur cet appareil.");
    }
  };

  // Automatic attendance on entry & exit
  useEffect(() => {
    if (!currentUser) return;
    const now = new Date();
    const joinTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setJoinTimeStr(joinTime);

    if (currentUser.role === 'élève') {
      logStudentJoin(session.id, currentUser, session.startTime).then(id => {
        if (id) setAttendanceId(id);
      });
    }

    // Post announcement in classroom chat
    sendInClassMessage(session.id, currentUser, `${currentUser.prenom} ${currentUser.nom} a rejoint la classe.`, true);

    return () => {
      if (attendanceId) {
        logStudentLeave(attendanceId, joinTime);
      }
      sendInClassMessage(session.id, currentUser, `${currentUser.prenom} ${currentUser.nom} a quitté la classe.`, true);
    };
  }, [session.id, currentUser]);

  // Real-time Chat listener
  useEffect(() => {
    const q = query(
      collection(db, `online_sessions/${session.id}/messages`),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InClassMessage));
      setMessages(msgs);
    });
    return () => unsub();
  }, [session.id]);

  // Real-time Hand-raises listener
  useEffect(() => {
    const q = collection(db, `online_sessions/${session.id}/hands`);
    const unsub = onSnapshot(q, (snapshot) => {
      const hands = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HandRaise));
      setHandRaises(hands);
      if (currentUser) {
        setHasRaisedHand(hands.some(h => h.studentId === currentUser.id));
      }
    });
    return () => unsub();
  }, [session.id, currentUser]);

  // Real-time Attendance list listener for teacher
  useEffect(() => {
    const q = query(
      collection(db, 'online_attendance'),
      where('sessionId', '==', session.id)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const atts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttendanceList(atts);
    });
    return () => unsub();
  }, [session.id]);

  // Toggle Camera
  const handleToggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    } else {
      setIsVideoOn(prev => !prev);
    }
  };

  // Toggle Microphone
  const handleToggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    } else {
      setIsMicOn(prev => !prev);
    }
  };

  // Toggle Screen Sharing
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
      setScreenSharerName(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        setIsScreenSharing(true);
        const name = `${currentUser?.prenom || ''} ${currentUser?.nom || ''}`.trim() || 'Enseignant';
        setScreenSharerName(name);

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          setScreenSharerName(null);
        };

        sendInClassMessage(session.id, currentUser!, `${name} a commencé le partage d'écran.`, true);
      } catch (err: any) {
        console.warn("Screen sharing cancelled or unavailable:", err);
      }
    }
  };

  // Toggle Recording via native MediaRecorder API
  const handleToggleRecording = () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      notifySuccess("Enregistrement du cours terminé ! Fichier prêt.");
    } else {
      try {
        const streamToRecord = screenStream || localStream;
        if (!streamToRecord) {
          notifyError("Aucun flux vidéo actif à enregistrer.");
          return;
        }

        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(streamToRecord, { mimeType: 'video/webm' });
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          
          // Save metadata
          saveCourseRecording(session.id, {
            title: session.title,
            subject: session.subject,
            classe: session.classe,
            teacherName: session.teacherName,
            durationMinutes: Math.max(1, Math.round(recordingTimer / 60)),
            videoUrl: url,
            attendanceCount: attendanceList.length,
            etablissement: session.etablissement || 'EDU-001'
          });

          // Offer immediate download
          const a = document.createElement('a');
          a.href = url;
          a.download = `EduNify_${session.subject}_${session.classe}_${session.date}.webm`;
          a.click();
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        notifySuccess("🔴 Enregistrement du cours démarré.");
        sendInClassMessage(session.id, currentUser!, "L'enregistrement de la séance a débuté.", true);
      } catch (err: any) {
        console.error("Recording error:", err);
        notifyError("Impossible de démarrer l'enregistrement vidéo.");
      }
    }
  };

  // Send Chat message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentUser) return;
    sendInClassMessage(session.id, currentUser, inputMessage.trim());
    setInputMessage('');
  };

  // Hand Raise
  const handleToggleHandRaise = () => {
    if (!currentUser) return;
    if (hasRaisedHand) {
      lowerHand(session.id, currentUser.id);
      setHasRaisedHand(false);
    } else {
      raiseHand(session.id, currentUser);
      setHasRaisedHand(true);
      notifyInfo("Vous avez levé la main 🙋");
    }
  };

  // Lock Room
  const handleToggleRoomLock = async () => {
    if (!isTeacherOrHost) return;
    try {
      const newLocked = !isRoomLocked;
      setIsRoomLocked(newLocked);
      await updateDoc(doc(db, 'online_sessions', session.id), { isLocked: newLocked });
      notifySuccess(newLocked ? "Salle verrouillée. Nouveaux élèves bloqués." : "Salle déverrouillée.");
      sendInClassMessage(session.id, currentUser!, newLocked ? "La salle a été verrouillée par l'enseignant." : "La salle est maintenant déverrouillée.", true);
    } catch (err) {
      console.error(err);
    }
  };

  // End Session for Everyone
  const handleEndClassForEveryone = () => {
    setShowEndModal(true);
  };

  const confirmEndClassForEveryone = async () => {
    setIsEndingSession(true);
    try {
      await endOnlineSession(session.id, Math.max(1, sessionDurationMinutes));
      notifySuccess("Le cours en direct a été clôturé avec succès.");
      setShowEndModal(false);
      onLeave();
    } catch (err) {
      console.error(err);
      notifyError("Erreur lors de la clôture de la séance.");
    } finally {
      setIsEndingSession(false);
    }
  };

  // Whiteboard drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    currentStrokePointsRef.current = [{ x, y }];
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = drawBrushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = drawTool === 'eraser' ? '#ffffff' : drawColor;
    ctx.lineTo(x, y);
    ctx.stroke();

    currentStrokePointsRef.current.push({ x, y });
  };

  const stopDrawing = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStrokePointsRef.current.length > 1) {
      await syncWhiteboardStroke(session.id, {
        points: currentStrokePointsRef.current,
        color: drawColor,
        width: drawBrushSize,
        isEraser: drawTool === 'eraser'
      });
    }
    currentStrokePointsRef.current = [];
  };

  const clearWhiteboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    await clearWhiteboardStrokes(session.id);
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col bg-gray-950 text-white select-none ${isFullscreen ? 'p-0' : ''}`}>
      {/* 1. Header de Salle Virtuelle */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-red-600/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full text-xs font-black tracking-wide">
            <Radio size={14} className="animate-pulse text-red-500" />
            <span>EDU-NIFY LIVE</span>
          </div>
          <div className="h-4 w-[1px] bg-gray-700 hidden sm:block"></div>
          <div>
            <h1 className="font-bold text-sm text-gray-100 flex items-center gap-2">
              <span>{session.subject}</span>
              <span className="text-gray-400">—</span>
              <span className="text-indigo-400 font-semibold">{session.classe}</span>
              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded border border-gray-700 hidden md:inline">
                {session.title}
              </span>
            </h1>
          </div>
        </div>

        {/* Center Indicators */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Real-time active attendance count */}
          <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-600/50 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>{attendanceList.length + 1} participant{attendanceList.length > 0 ? 's' : ''} actif{attendanceList.length > 0 ? 's' : ''}</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400 bg-gray-800/80 px-3 py-1 rounded-full border border-gray-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Réseau : Stable HD</span>
          </div>

          {isRecording && (
            <div className="flex items-center gap-2 bg-red-950/80 border border-red-600/50 text-red-400 px-3 py-1 rounded-full text-xs font-mono font-bold animate-pulse">
              <Circle size={10} className="fill-red-500 text-red-500" />
              <span>REC {formatRecTime(recordingTimer)}</span>
            </div>
          )}

          {isRoomLocked && (
            <div className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-600/50 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold">
              <Lock size={12} />
              <span>Verrouillé</span>
            </div>
          )}
        </div>

        {/* Top-Right Tools */}
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-400 font-mono bg-gray-800 px-2.5 py-1 rounded border border-gray-700">
            {currentTimeStr}
          </div>

          {isTeacherOrHost && (
            <button
              onClick={handleToggleRoomLock}
              title={isRoomLocked ? "Déverrouiller la salle" : "Verrouiller la salle"}
              className={`p-2 rounded-lg border transition-colors ${isRoomLocked ? 'bg-amber-600/20 text-amber-300 border-amber-500/50' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}
            >
              {isRoomLocked ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
          )}

          <button
            onClick={() => setUseJitsiBridge(prev => !prev)}
            title="Basculer vers la passerelle Jitsi Meet HD"
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${useJitsiBridge ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'}`}
          >
            <ExternalLink size={13} />
            <span>Passerelle WebRTC</span>
          </button>

          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
                setIsFullscreen(true);
              } else {
                document.exitFullscreen().catch(() => {});
                setIsFullscreen(false);
              }
            }}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg border border-gray-700"
            title="Plein écran"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* 2. Main Stage & Video Viewport */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Stage Central */}
        <div className="flex-1 flex flex-col p-2 sm:p-3 gap-2 sm:gap-3 overflow-hidden bg-gray-950 min-h-0">
          {/* Main Video Viewport (Speaker / Screen share / Teacher) */}
          <div className="flex-1 bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-800 relative overflow-hidden flex items-center justify-center shadow-2xl group min-h-[200px]">
            {useJitsiBridge ? (
              <iframe
                src={`https://meet.jit.si/edunify_${session.etablissement || 'EDU-001'}_${session.virtualRoomId}#config.prejoinPageEnabled=false&userInfo.displayName="${encodeURIComponent(`${currentUser?.prenom || ''} ${currentUser?.nom || ''}`.trim() || 'Participant')}"`}
                allow="camera; microphone; display-capture; autoplay; clipboard-write"
                className="w-full h-full border-none rounded-xl sm:rounded-2xl"
                title="Visioconférence Jitsi Meet Edu-Nify"
              />
            ) : isScreenSharing ? (
              <div className="w-full h-full relative flex items-center justify-center bg-black">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  className="max-h-full max-w-full object-contain"
                />
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-black/75 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 z-10">
                  <ScreenShare size={14} className="text-indigo-400" />
                  <span className="truncate max-w-[200px] sm:max-w-none">{screenSharerName || session.teacherName} partage son écran</span>
                </div>

                {/* Floating Picture-in-Picture Webcam Tile */}
                {isVideoOn && localStream && (
                  <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-28 h-20 sm:w-44 sm:h-32 rounded-xl border-2 border-indigo-500 shadow-2xl overflow-hidden bg-gray-900 z-20 group/pip transition-all">
                    <video
                      ref={pipVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-1.5 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-bold text-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span className="truncate max-w-[70px]">{currentUser?.prenom || 'Moi'}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : isVideoOn ? (
              <div className="w-full h-full relative flex items-center justify-center bg-gray-950">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full transition-all duration-300 rounded-xl sm:rounded-2xl ${
                    cameraFitMode === 'contain' ? 'object-contain bg-black' : 'object-cover'
                  }`}
                />

                {/* Camera Responsive Controls (Framing & Front/Rear Camera) */}
                <div className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 flex items-center gap-1.5 z-10">
                  {/* Framing Mode Toggle */}
                  <button
                    type="button"
                    onClick={() => setCameraFitMode(m => m === 'cover' ? 'contain' : 'cover')}
                    className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/90 hover:text-white px-2 py-1 rounded-lg text-[10px] font-semibold border border-white/10 flex items-center gap-1 transition-all shadow-md"
                    title={cameraFitMode === 'cover' ? "Adapter à l'écran (voir toute la caméra sans rognage)" : "Remplir l'écran (plein cadre)"}
                  >
                    {cameraFitMode === 'cover' ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                    <span className="hidden xs:inline">{cameraFitMode === 'cover' ? "Adapter" : "Remplir"}</span>
                  </button>

                  {/* Switch Front/Rear Camera */}
                  <button
                    type="button"
                    onClick={handleSwitchFacingMode}
                    className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/90 hover:text-white px-2 py-1 rounded-lg text-[10px] font-semibold border border-white/10 flex items-center gap-1 transition-all shadow-md"
                    title="Basculer caméra avant / arrière"
                  >
                    <FlipHorizontal size={12} />
                    <span className="hidden xs:inline">{facingMode === 'user' ? 'Avant' : 'Arrière'}</span>
                  </button>
                </div>

                {/* Speaker Overlay Badge */}
                <div className="absolute bottom-2.5 sm:bottom-4 left-2.5 sm:left-4 bg-gray-900/85 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-700/80 flex items-center gap-2 max-w-[85%] z-10 shadow-lg">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                  <span className="text-[11px] sm:text-xs font-bold text-gray-200 truncate">
                    {isTeacherOrHost ? `Prof. ${session.teacherName}` : `${currentUser?.prenom} ${currentUser?.nom}`}
                  </span>
                  {!isMicOn && <MicOff size={12} className="text-red-400 ml-1 shrink-0" />}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center p-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-500/20 border-2 border-indigo-400/40">
                  {currentUser?.prenom?.[0] || 'U'}{currentUser?.nom?.[0] || 'N'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {isTeacherOrHost ? `Prof. ${session.teacherName}` : `${currentUser?.prenom} ${currentUser?.nom}`}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Caméra désactivée • En écoute</p>
                </div>
              </div>
            )}

            {/* Hand Raised Alert Badge on Video */}
            {handRaises.length > 0 && (
              <div className="absolute top-4 right-4 bg-amber-500/90 backdrop-blur-md text-amber-950 font-black text-xs px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-lg animate-bounce z-10">
                <span>🙋 {handRaises.length} main{handRaises.length > 1 ? 's' : ''} levée{handRaises.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Participant Thumbnails Strip */}
          {showParticipantStrip && (
            <div className="h-20 sm:h-24 md:h-28 flex gap-2 sm:gap-3 overflow-x-auto pb-1 shrink-0 scrollbar-thin scrollbar-thumb-gray-800">
              {/* Host Thumbnail */}
              <div className="w-28 sm:w-36 md:w-40 h-full bg-gray-900 border border-gray-800 rounded-xl relative overflow-hidden flex flex-col items-center justify-center shrink-0 p-1.5 sm:p-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-900/60 border border-indigo-500/40 flex items-center justify-center text-xs sm:text-sm font-bold text-indigo-300 mb-0.5 sm:mb-1">
                  {session.teacherName.charAt(0)}
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-gray-200 truncate max-w-[100px] sm:max-w-[120px]">
                  M. {session.teacherName.split(' ')[0]}
                </span>
                <span className="text-[8px] sm:text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Hôte</span>
                <div className="absolute top-1.5 right-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>
                </div>
              </div>

              {/* Students attendance tiles */}
              {attendanceList.map((att) => (
                <div 
                  key={att.id || att.studentId}
                  className="w-28 sm:w-36 md:w-40 h-full bg-gray-900 border border-gray-800 rounded-xl relative overflow-hidden flex flex-col items-center justify-center shrink-0 p-1.5 sm:p-2 hover:border-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs sm:text-sm font-bold text-gray-300 mb-0.5 sm:mb-1">
                    {att.studentName?.charAt(0) || 'E'}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-gray-200 truncate max-w-[100px] sm:max-w-[120px]">
                    {att.studentName}
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-gray-400 truncate max-w-[90px]">{att.classe || 'Élève'}</span>
                  {att.status === 'late' ? (
                    <span className="absolute bottom-1 right-1 text-[7px] sm:text-[8px] bg-amber-500/20 text-amber-400 px-1 rounded font-bold">Retard</span>
                  ) : (
                    <span className="absolute bottom-1 right-1 text-[7px] sm:text-[8px] bg-emerald-500/20 text-emerald-400 px-1 rounded font-bold">Présent</span>
                  )}
                  {handRaises.some(h => h.studentId === att.studentId) && (
                    <span className="absolute top-1 right-1 text-xs animate-bounce">🙋</span>
                  )}
                </div>
              ))}

              {/* Placeholder if small class */}
              {attendanceList.length === 0 && (
                <div className="flex-1 min-w-[200px] bg-gray-900/40 border border-dashed border-gray-800 rounded-xl flex items-center justify-center text-xs text-gray-500 font-medium px-4 text-center">
                  En attente de connexion des élèves de la classe {session.classe}...
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Panneau Latéral (Chat, Participants, Whiteboard) */}
        {activeSidePanel && (
          <>
            {/* Backdrop overlay on mobile */}
            <div 
              className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"
              onClick={() => setActiveSidePanel(null)}
            />
            <aside className="fixed md:relative inset-y-0 right-0 w-full sm:w-80 md:w-96 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0 h-full z-40 animate-in slide-in-from-right duration-200 shadow-2xl">
            {/* Panel Tabs */}
            <div className="h-12 border-b border-gray-800 px-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveSidePanel('chat')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeSidePanel === 'chat' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <MessageSquare size={14} />
                  <span>Discussion</span>
                </button>
                <button
                  onClick={() => setActiveSidePanel('participants')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeSidePanel === 'participants' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Users size={14} />
                  <span>Participants ({attendanceList.length + 1})</span>
                </button>
                <button
                  onClick={() => setActiveSidePanel('whiteboard')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeSidePanel === 'whiteboard' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <PenTool size={14} />
                  <span>Tableau</span>
                </button>
              </div>

              <button
                onClick={() => setActiveSidePanel(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
              >
                <X size={16} />
              </button>
            </div>

            {/* TAB CONTENT: CHAT */}
            {activeSidePanel === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-3 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-800">
                  {messages.map((m) => (
                    <div 
                      key={m.id} 
                      className={`flex flex-col ${m.isSystem ? 'items-center my-1' : m.senderId === currentUser?.id ? 'items-end' : 'items-start'}`}
                    >
                      {m.isSystem ? (
                        <div className="bg-gray-800/80 border border-gray-700/60 text-gray-300 text-[10px] px-2.5 py-1 rounded-full font-mono text-center">
                          {m.text}
                        </div>
                      ) : (
                        <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${m.senderId === currentUser?.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 border border-gray-700/70 rounded-bl-none'}`}>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-[11px] text-indigo-200">
                              {m.senderName}
                            </span>
                            <span className="text-[9px] opacity-60 font-mono">
                              {m.timestamp}
                            </span>
                          </div>
                          <p>{m.text}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-800 flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Écrire un message à la classe..."
                    className="flex-1 bg-gray-800 border border-gray-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 placeholder-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT: PARTICIPANTS */}
            {activeSidePanel === 'participants' && (
              <div className="flex-1 flex flex-col p-3 overflow-y-auto space-y-4">
                {/* Hand raise queue if any */}
                {handRaises.length > 0 && (
                  <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3">
                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span>🙋 Mains levées ({handRaises.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {handRaises.map(h => (
                        <div key={h.id} className="flex items-center justify-between text-xs bg-amber-900/20 p-2 rounded-lg border border-amber-800/40">
                          <span className="font-bold text-amber-200">{h.studentName}</span>
                          {isTeacherOrHost && (
                            <button
                              onClick={() => lowerHand(session.id, h.studentId)}
                              className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold"
                            >
                              Baisser la main
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Host */}
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Enseignant</h4>
                  <div className="flex items-center justify-between p-2.5 bg-gray-800/60 rounded-xl border border-gray-700/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                        {session.teacherName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-200">M. {session.teacherName}</div>
                        <div className="text-[10px] text-indigo-400 font-semibold">Organisateur</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400">
                      <Mic size={14} />
                      <Video size={14} />
                    </div>
                  </div>
                </div>

                {/* Students list */}
                <div className="flex-1">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Élèves connectés ({attendanceList.length})
                  </h4>
                  <div className="space-y-2">
                    {attendanceList.map(student => (
                      <div key={student.id} className="flex items-center justify-between p-2 bg-gray-800/40 rounded-xl border border-gray-700/40">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                            {student.studentName?.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-200">{student.studentName}</div>
                            <div className="text-[10px] text-gray-400">Arrivée : {student.joinedAt} • {student.status === 'late' ? 'En retard' : 'À l\'heure'}</div>
                          </div>
                        </div>
                        {isTeacherOrHost && (
                          <button
                            onClick={() => notifyInfo(`Micro de ${student.studentName} géré par l'enseignant`)}
                            className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-white rounded"
                            title="Couper le micro"
                          >
                            <VolumeX size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: WHITEBOARD */}
            {activeSidePanel === 'whiteboard' && (
              <div className="flex-1 flex flex-col p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setDrawTool('pen')}
                      className={`p-2 rounded-lg text-xs font-bold ${drawTool === 'pen' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300'}`}
                      title="Stylo"
                    >
                      <PenTool size={14} />
                    </button>
                    <button
                      onClick={() => setDrawTool('eraser')}
                      className={`p-2 rounded-lg text-xs font-bold ${drawTool === 'eraser' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300'}`}
                      title="Gomme"
                    >
                      <Eraser size={14} />
                    </button>
                    <div className="flex gap-1 ml-2">
                      {['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#000000'].map(c => (
                        <button
                          key={c}
                          onClick={() => setDrawColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-5 h-5 rounded-full border ${drawColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={clearWhiteboard}
                    className="p-1.5 bg-gray-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400 rounded-lg text-xs flex items-center gap-1"
                    title="Effacer tout"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex-1 bg-white rounded-xl overflow-hidden border border-gray-700 shadow-inner relative">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={500}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full h-full cursor-crosshair"
                  />
                </div>
                <p className="text-[10px] text-gray-500 text-center mt-1.5">
                  Tableau blanc partagé en direct avec les élèves de {session.classe}
                </p>
              </div>
            )}
          </aside>
        </>
        )}
      </div>

      {/* 4. Barre de Contrôles Inférieure (100% responsive mobile & desktop) */}
      <footer className="min-h-16 sm:h-20 bg-gray-900 border-t border-gray-800 px-2 sm:px-6 py-2 sm:py-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shrink-0 z-20">
        {/* Left Info */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center font-black text-indigo-400 border border-gray-700">
            EN
          </div>
          <div>
            <div className="text-xs font-bold text-white">{session.title}</div>
            <div className="text-[11px] text-gray-400">Durée en cours : {sessionDurationMinutes} min</div>
          </div>
        </div>

        {/* Center Main Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 mx-auto sm:mx-0 overflow-x-auto max-w-full py-1 scrollbar-none">
          {/* Micro */}
          <button
            onClick={handleToggleMic}
            className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all shadow-md flex items-center justify-center shrink-0 ${isMicOn ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700' : 'bg-red-600 text-white shadow-red-500/20 animate-pulse'}`}
            title={isMicOn ? "Couper le micro" : "Activer le micro"}
          >
            {isMicOn ? <Mic size={18} className="sm:w-5 sm:h-5" /> : <MicOff size={18} className="sm:w-5 sm:h-5" />}
          </button>

          {/* Caméra */}
          <button
            onClick={handleToggleVideo}
            className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all shadow-md flex items-center justify-center shrink-0 ${isVideoOn ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700' : 'bg-red-600 text-white shadow-red-500/20'}`}
            title={isVideoOn ? "Couper la caméra" : "Activer la caméra"}
          >
            {isVideoOn ? <Video size={18} className="sm:w-5 sm:h-5" /> : <VideoOff size={18} className="sm:w-5 sm:h-5" />}
          </button>

          {/* Basculer Caméra Avant/Arrière (Mobile & Tablettes) */}
          <button
            onClick={handleSwitchFacingMode}
            className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-all shadow-md flex items-center justify-center shrink-0"
            title="Basculer caméra avant / arrière"
          >
            <FlipHorizontal size={18} className="sm:w-5 sm:h-5" />
          </button>

          {/* Partage d'écran */}
          {isTeacherOrHost && (
            <button
              onClick={handleToggleScreenShare}
              className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all shadow-md flex items-center justify-center shrink-0 ${isScreenSharing ? 'bg-indigo-600 text-white shadow-indigo-500/30' : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700'}`}
              title={isScreenSharing ? "Arrêter le partage d'écran" : "Partager l'écran"}
            >
              <ScreenShare size={18} className="sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Enregistrement (Host only) */}
          {isTeacherOrHost && (
            <button
              onClick={handleToggleRecording}
              className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all shadow-md flex items-center justify-center shrink-0 ${isRecording ? 'bg-red-600 text-white shadow-red-600/30 animate-pulse' : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700'}`}
              title={isRecording ? "Arrêter l'enregistrement" : "Enregistrer la séance"}
            >
              <Circle size={18} className={`sm:w-5 sm:h-5 ${isRecording ? "fill-white" : ""}`} />
            </button>
          )}

          {/* Lever la main (Élèves) */}
          {!isTeacherOrHost && (
            <button
              onClick={handleToggleHandRaise}
              className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all shadow-md flex items-center justify-center shrink-0 ${hasRaisedHand ? 'bg-amber-500 text-amber-950 font-bold scale-105 shadow-amber-500/30' : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700'}`}
              title={hasRaisedHand ? "Baisser la main" : "Lever la main"}
            >
              <Hand size={18} className="sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Tableau Blanc */}
          <button
            onClick={() => setActiveSidePanel(prev => prev === 'whiteboard' ? null : 'whiteboard')}
            className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all shadow-md flex items-center justify-center shrink-0 ${activeSidePanel === 'whiteboard' ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700'}`}
            title="Tableau blanc interactif"
          >
            <PenTool size={18} className="sm:w-5 sm:h-5" />
          </button>

          {/* Discussion */}
          <button
            onClick={() => setActiveSidePanel(prev => prev === 'chat' ? null : 'chat')}
            className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all shadow-md flex items-center justify-center shrink-0 relative ${activeSidePanel === 'chat' ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700'}`}
            title="Discussion en direct"
          >
            <MessageSquare size={18} className="sm:w-5 sm:h-5" />
            {messages.length > 0 && activeSidePanel !== 'chat' && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-indigo-500 text-white font-black text-[9px] sm:text-[10px] rounded-full flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </button>

          {/* Participants */}
          <button
            onClick={() => setActiveSidePanel(prev => prev === 'participants' ? null : 'participants')}
            className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all shadow-md flex items-center justify-center shrink-0 relative ${activeSidePanel === 'participants' ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700'}`}
            title="Liste des participants"
          >
            <Users size={18} className="sm:w-5 sm:h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gray-700 text-white font-black text-[9px] sm:text-[10px] rounded-full flex items-center justify-center border border-gray-600">
              {attendanceList.length + 1}
            </span>
          </button>

          {/* Masquer / Afficher Bande des vignettes */}
          <button
            onClick={() => setShowParticipantStrip(prev => !prev)}
            className={`hidden sm:flex p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all shadow-md items-center justify-center shrink-0 ${showParticipantStrip ? 'bg-gray-800 text-gray-300 hover:text-white border border-gray-700' : 'bg-indigo-900/40 text-indigo-300 border border-indigo-600/40'}`}
            title={showParticipantStrip ? "Masquer les vignettes" : "Afficher les vignettes"}
          >
            <Layers size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Right Exit Buttons */}
        <div className="flex items-center gap-2 ml-auto sm:ml-0 shrink-0">
          {isTeacherOrHost && (
            <button
              onClick={handleEndClassForEveryone}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-red-600/30 whitespace-nowrap"
              title="Arrêter le direct et clôturer la séance pour tous"
            >
              <StopCircle size={15} />
              <span>Arrêter le direct</span>
            </button>
          )}

          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-xl text-xs transition-colors border border-gray-700 shrink-0"
            title="Quitter la salle virtuelle"
          >
            <LogOut size={15} />
            <span className="hidden xs:inline">Quitter</span>
          </button>
        </div>
      </footer>

      {/* Confirmation Modal to End Class for Everyone */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-4 border border-red-500/30">
              <StopCircle size={28} />
            </div>

            <h3 className="text-lg font-bold mb-2">
              Arrêter le cours en direct ?
            </h3>
            
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              Cette action coupera la transmission vidéo en direct pour toute la classe, clôturera automatiquement la feuille d'émargement de tous les élèves connectés et archivera la séance.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                disabled={isEndingSession}
                className="px-4 py-2.5 text-xs font-bold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors border border-gray-700"
              >
                Continuer le cours
              </button>

              <button
                type="button"
                onClick={confirmEndClassForEveryone}
                disabled={isEndingSession}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-600/30 transition-all"
              >
                {isEndingSession ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Arrêt en cours...</span>
                  </>
                ) : (
                  <>
                    <StopCircle size={15} />
                    <span>Oui, arrêter le direct</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
