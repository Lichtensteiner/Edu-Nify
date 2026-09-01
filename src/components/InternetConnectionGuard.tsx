import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function InternetConnectionGuard() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [showRestoredBanner, setShowRestoredBanner] = useState(false);

  // Test actual connectivity with a lightweight fetch probe
  const verifyRealConnection = async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    try {
      // Test with cache-busting HEAD request to a local static asset
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`/logo.png?_probe=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok || res.status === 304 || res.status === 200;
    } catch {
      // If fetch fails, fall back to navigator.onLine
      return typeof navigator !== 'undefined' ? navigator.onLine : false;
    }
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    setCheckError(null);
    try {
      const online = await verifyRealConnection();
      setIsOnline(online);
      if (!online) {
        setCheckError("Connexion toujours indisponible. Veuillez vérifier votre réseau Wi-Fi, câble Ethernet ou données mobiles.");
      } else {
        setShowRestoredBanner(true);
        setTimeout(() => setShowRestoredBanner(false), 4500);
      }
    } catch {
      setIsOnline(false);
      setCheckError("Impossible d'établir une connexion Internet.");
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const handleOnlineEvent = async () => {
      const online = await verifyRealConnection();
      setIsOnline(online);
      if (online) {
        setShowRestoredBanner(true);
        setTimeout(() => setShowRestoredBanner(false), 4500);
      }
    };

    const handleOfflineEvent = () => {
      setIsOnline(false);
      setCheckError(null);
    };

    window.addEventListener('online', handleOnlineEvent);
    window.addEventListener('offline', handleOfflineEvent);

    // Initial sanity check on mount
    if (!navigator.onLine) {
      setIsOnline(false);
    }

    return () => {
      window.removeEventListener('online', handleOnlineEvent);
      window.removeEventListener('offline', handleOfflineEvent);
    };
  }, []);

  return (
    <>
      {/* Restored Connection Toast */}
      {showRestoredBanner && isOnline && (
        <div 
          id="network-restored-toast"
          className="fixed top-5 right-5 z-[999999] flex items-center gap-3 px-5 py-3.5 bg-emerald-600 text-white rounded-2xl shadow-2xl border border-emerald-400/40 animate-bounce transition-all duration-300 font-sans"
        >
          <div className="p-1.5 bg-white/20 rounded-xl">
            <Wifi size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider">Connexion Rétablie</p>
            <p className="text-[11px] text-emerald-100 font-medium">L'application Edu-Nify est connectée et synchronisée en temps réel.</p>
          </div>
        </div>
      )}

      {/* Offline Alert Modal / Blocker */}
      {!isOnline && (
        <div 
          id="offline-guard-overlay"
          className="fixed inset-0 z-[999998] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans"
        >
          <div 
            id="offline-guard-card"
            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-rose-500/40 dark:border-rose-500/30 text-center relative overflow-hidden"
          >
            {/* Top decorative glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Pulsing Icon */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950/60 rounded-3xl flex items-center justify-center border-2 border-rose-200 dark:border-rose-800/80 shadow-lg shadow-rose-500/10">
                <WifiOff className="w-10 h-10 text-rose-600 dark:text-rose-400 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
              </span>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 rounded-full text-[11px] font-black tracking-wider uppercase border border-rose-200 dark:border-rose-900/60 mb-3">
              <ShieldAlert size={13} />
              Accès Bloqué • Mode En Ligne Requis
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
              Connexion Internet Requise
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed max-w-md mx-auto mb-6">
              L'application <strong className="text-indigo-600 dark:text-indigo-400">Edu-Nify</strong> fonctionne exclusivement avec une connexion Internet active pour assurer l'intégrité, la sécurité et la synchronisation en temps réel de vos données d'établissement.
            </p>

            {/* Diagnosis / Info Box */}
            <div className="bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-750 rounded-2xl p-4 text-left space-y-2 mb-6">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-500 dark:text-gray-400">Statut Réseau :</span>
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-black">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  Hors-ligne (Aucun signal)
                </span>
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2 flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <span>Veuillez vérifier votre signal Wi-Fi, votre routeur ou vos données mobiles (4G/5G) pour reprendre votre session.</span>
              </div>
            </div>

            {/* Error notice if manual check fails */}
            {checkError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-300 font-bold animate-shake">
                {checkError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <button
                id="btn-retry-connection"
                onClick={handleManualCheck}
                disabled={isChecking}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={isChecking ? 'animate-spin' : ''} size={15} />
                {isChecking ? 'Vérification du réseau...' : 'Vérifier & Réessayer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
